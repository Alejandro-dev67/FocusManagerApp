from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.database import tareas_collection, db

task_routes = Blueprint("task_routes", __name__)

def get_user():
    return request.headers.get("X-User")

# Crear tarea 
@task_routes.route("/api/tareas", methods=["POST"])
def crear_tarea():
    user = get_user()
    if not user: return jsonify({"error":"No autorizado"}), 401
    data = request.json
    tarea = {
        "usuario": user,
        "board_id": data.get("board_id"),           # debe venir del frontend
        "titulo": data.get("titulo"),
        "descripcion": data.get("descripcion", ""),
        "fecha": data.get("fecha"),                 # formato 'YYYY-MM-DD'
        "prioridad": data.get("prioridad", "Media"),
        "estado": data.get("estado", "todo"),       # todo|doing|done
        "completada": bool(data.get("completada", False))
    }
    res = tareas_collection.insert_one(tarea)
    tarea["_id"] = str(res.inserted_id)
    return jsonify(tarea), 201

# Obtener tareas 
@task_routes.route("/api/tareas", methods=["GET"])
def obtener_tareas():
    user = get_user()
    if not user: return jsonify([]), 401
    board_id = request.args.get("board_id")
    query = {"usuario": user}
    if board_id:
        query["board_id"] = board_id
    tareas = []
    for t in tareas_collection.find(query):
        t["_id"] = str(t["_id"])
        tareas.append(t)
    return jsonify(tareas), 200

# Actualizar tarea
@task_routes.route("/api/tareas/<id>", methods=["PUT"])
def actualizar_tarea(id):
    user = get_user()
    if not user: return jsonify({"error":"No autorizado"}), 401
    data = request.json
    tareas_collection.update_one({"_id": ObjectId(id), "usuario": user}, {"$set": data})
    t = tareas_collection.find_one({"_id": ObjectId(id)})
    t["_id"] = str(t["_id"])
    return jsonify(t), 200

# Eliminar tarea
@task_routes.route("/api/tareas/<id>", methods=["DELETE"])
def eliminar_tarea(id):
    user = get_user()
    if not user: return jsonify({"error":"No autorizado"}), 401
    tareas_collection.delete_one({"_id": ObjectId(id), "usuario": user})
    return jsonify({"mensaje":"eliminada"}), 200

# Calendario
@task_routes.route("/api/calendar", methods=["GET"])
def calendar():
    user = get_user()
    if not user: return jsonify([]), 401
    date = request.args.get("date")
    if not date:
        return jsonify({"error":"date requerido"}), 400
    tareas = []
    for t in tareas_collection.find({"usuario": user, "fecha": date}):
        t["_id"] = str(t["_id"])
        tareas.append(t)
    return jsonify(tareas), 200