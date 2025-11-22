from pymongo import MongoClient


client = MongoClient("mongodb://localhost:27017/")

db = client["focusmanager_db"]

tareas_collection = db["tareas"]
usuarios_collection = db["usuarios"]
