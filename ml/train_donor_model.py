# ml/train_model.py
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import pickle

# --- Sample Training Data ---
data = {
    'bloodGroupMatch': [1, 0, 1, 0, 1, 1, 0, 1],
    'cityMatch': [1, 1, 0, 1, 0, 1, 0, 1],
    'isAvailable': [1, 0, 1, 1, 0, 1, 1, 0],
    'monthsSinceLastDonation': [2, 6, 1, 8, 4, 3, 10, 2],
    'respondedPreviously': [1, 0, 1, 0, 0, 1, 0, 1]
}

df = pd.DataFrame(data)

X = df[['bloodGroupMatch', 'cityMatch', 'isAvailable', 'monthsSinceLastDonation']]
y = df['respondedPreviously']


# --- Train a simple logistic regression model ---
model = LogisticRegression()
model.fit(X, y)

# --- Save the trained model ---
pickle.dump(model, open("ml/model.pkl", "wb"))
print("✅ Model trained and saved as ml/model.pkl")
