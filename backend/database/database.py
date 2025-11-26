# Importación de MongoDB
from pymongo import MongoClient

# Conexión con el servidor de MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Selección de la base de datos 
db = client["focusmanager_db"]

# Colecciones donde se guardan los datos del usuario
tareas_collection = db["tareas"]
usuarios_collection = db["usuarios"]
