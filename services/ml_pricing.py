import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import pickle
import os
from datetime import datetime
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = "/tmp/ml_models"
os.makedirs(MODEL_DIR, exist_ok=True)


class MLPricingModel:
    def __init__(self):
        self.price_predictor = None
        self.success_predictor = None
        self.scaler = StandardScaler()
        self.model_version = "1.0"

    def train_price_prediction_model(self, negotiation_data: list) -> Dict:
        """
        Train XGBoost-like model to predict optimal discount for negotiation.
        Requires: initial_price, moq, delivery_days, trust_score, final_price (target)
        """
        if len(negotiation_data) < 10:
            return {"status": "insufficient_data", "samples": len(negotiation_data)}

        try:
            df = pd.DataFrame(negotiation_data)
            required_cols = ["initial_price", "moq", "delivery_days", "trust_score", "final_price"]

            if not all(col in df.columns for col in required_cols):
                return {"status": "missing_columns", "required": required_cols}

            X = df[["initial_price", "moq", "delivery_days", "trust_score"]]
            y = df["final_price"]

            X_scaled = self.scaler.fit_transform(X)
            self.price_predictor = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.price_predictor.fit(X_scaled, y)

            # Save model
            self._save_model("price_predictor")

            score = self.price_predictor.score(X_scaled, y)
            logger.info(f"Price prediction model trained. R² score: {score:.4f}")

            return {
                "status": "success",
                "model_type": "price_predictor",
                "r2_score": float(score),
                "samples_used": len(df),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error training price predictor: {str(e)}")
            return {"status": "error", "message": str(e)}

    def train_success_prediction_model(self, negotiation_data: list) -> Dict:
        """
        Train RandomForest classifier to predict negotiation success.
        Requires: initial_price, moq, delivery_days, trust_score, supplier_rating, success (0/1 target)
        """
        if len(negotiation_data) < 10:
            return {"status": "insufficient_data", "samples": len(negotiation_data)}

        try:
            df = pd.DataFrame(negotiation_data)
            required_cols = ["initial_price", "moq", "delivery_days", "trust_score", "supplier_rating", "success"]

            if not all(col in df.columns for col in required_cols):
                return {"status": "missing_columns", "required": required_cols}

            X = df[["initial_price", "moq", "delivery_days", "trust_score", "supplier_rating"]]
            y = df["success"]

            X_scaled = self.scaler.fit_transform(X)
            self.success_predictor = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.success_predictor.fit(X_scaled, y)

            # Save model
            self._save_model("success_predictor")

            score = self.success_predictor.score(X_scaled, y)
            logger.info(f"Success prediction model trained. Accuracy: {score:.4f}")

            return {
                "status": "success",
                "model_type": "success_predictor",
                "accuracy": float(score),
                "samples_used": len(df),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error training success predictor: {str(e)}")
            return {"status": "error", "message": str(e)}

    def predict_optimal_price(
        self,
        initial_price: float,
        moq: int,
        delivery_days: int,
        trust_score: float
    ) -> Optional[float]:
        """Predict optimal final price for negotiation."""
        if self.price_predictor is None:
            logger.warning("Price predictor not trained")
            return None

        try:
            features = np.array([[initial_price, moq, delivery_days, trust_score]])
            features_scaled = self.scaler.transform(features)
            predicted_price = self.price_predictor.predict(features_scaled)[0]
            return float(predicted_price)
        except Exception as e:
            logger.error(f"Error predicting price: {str(e)}")
            return None

    def predict_success_probability(
        self,
        initial_price: float,
        moq: int,
        delivery_days: int,
        trust_score: float,
        supplier_rating: float
    ) -> Optional[float]:
        """Predict probability of successful negotiation."""
        if self.success_predictor is None:
            logger.warning("Success predictor not trained")
            return None

        try:
            features = np.array([[initial_price, moq, delivery_days, trust_score, supplier_rating]])
            features_scaled = self.scaler.transform(features)
            probabilities = self.success_predictor.predict_proba(features_scaled)[0]
            return float(probabilities[1])
        except Exception as e:
            logger.error(f"Error predicting success: {str(e)}")
            return None

    def _save_model(self, model_name: str):
        """Save trained model to disk."""
        try:
            if model_name == "price_predictor" and self.price_predictor:
                path = os.path.join(MODEL_DIR, f"{model_name}_{datetime.utcnow().timestamp()}.pkl")
                with open(path, "wb") as f:
                    pickle.dump(self.price_predictor, f)
                logger.info(f"Model saved: {path}")
            elif model_name == "success_predictor" and self.success_predictor:
                path = os.path.join(MODEL_DIR, f"{model_name}_{datetime.utcnow().timestamp()}.pkl")
                with open(path, "wb") as f:
                    pickle.dump(self.success_predictor, f)
                logger.info(f"Model saved: {path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")

    def load_model(self, model_name: str):
        """Load trained model from disk."""
        try:
            files = [f for f in os.listdir(MODEL_DIR) if f.startswith(model_name)]
            if not files:
                return False

            latest_file = max(files, key=lambda x: os.path.getctime(os.path.join(MODEL_DIR, x)))
            path = os.path.join(MODEL_DIR, latest_file)

            with open(path, "rb") as f:
                model = pickle.load(f)

            if model_name == "price_predictor":
                self.price_predictor = model
            elif model_name == "success_predictor":
                self.success_predictor = model

            logger.info(f"Model loaded: {path}")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False


ml_pricing_model = MLPricingModel()
