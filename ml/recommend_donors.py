import sys
import json
import numpy as np
import pickle

# ---- Safe input handling ----
if len(sys.argv) > 1:
    input_str = sys.argv[1]
else:
    input_str = json.dumps({
        "bloodGroup": "A+",
        "city": "Pune",
        "isAvailable": 1,
        "monthsSinceLastDonation": 3
    })

# ---- Parse input ----
try:
    data = json.loads(input_str)
except:
    # If plain string like "A+,Pune,3" is given
    parts = input_str.split(",")
    data = {
        "bloodGroup": parts[0],
        "city": parts[1],
        "isAvailable": 1,
        "monthsSinceLastDonation": int(parts[2])
    }

# ---- Encode categorical features ----
blood_map = {"A+":1, "A-":2, "B+":3, "B-":4, "AB+":5, "AB-":6, "O+":7, "O-":8}
city_map = {"Mumbai":1, "Pune":2, "Delhi":3, "Chennai":4, "Other":0}

blood_encoded = blood_map.get(data["bloodGroup"], 0)
city_encoded = city_map.get(data["city"], 0)

# ---- Final feature vector ----
X = np.array([[blood_encoded, city_encoded, data["isAvailable"], data["monthsSinceLastDonation"]]])

# ---- Load your model ----
model = pickle.load(open("ml/model.pkl", "rb"))  # example
pred = model.predict_proba(X)[0][1]

print(f"Predicted donor response probability: {pred:.2f}")
