"""
DigiRakshak ML Training Pipeline
TF-IDF + MultinomialNB Classifier for SMS Phishing Detection
"""
import os
import pickle
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "fraud_v1.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.dropna(subset=["text", "label"], inplace=True)
    df["text"] = df["text"].astype(str).str.strip()
    df["label"] = df["label"].astype(str).str.strip()
    print(f"[DATA] Loaded {len(df)} samples | Distribution:\n{df['label'].value_counts()}\n")
    return df


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ])


def train_and_evaluate(df: pd.DataFrame) -> Pipeline:
    X = df["text"].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print("=" * 55)
    print("  DigiRakshak ML Training Report")
    print("=" * 55)
    print(f"  Accuracy : {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("=" * 55)

    return pipeline


def save_model(pipeline: Pipeline, path: str) -> None:
    with open(path, "wb") as f:
        pickle.dump(pipeline, f)
    print(f"[SAVED] Model saved to {path}")


if __name__ == "__main__":
    df = load_data(DATA_PATH)
    pipeline = train_and_evaluate(df)
    save_model(pipeline, MODEL_PATH)
    print("\n[DONE] Model training complete. Ready for inference.")
