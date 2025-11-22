from pymongo import MongoClient

# 🔹 Conexión a MongoDB local
client = MongoClient("mongodb://localhost:27017/")

# 🔹 Base de datos principal
db = client["focusmanager_db"]

# 🔹 Colecciones
tareas_collection = db["tareas"]
usuarios_collection = db["usuarios"]
