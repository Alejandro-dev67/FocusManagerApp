# importaciones necesarias
from flask import Blueprint, request, jsonify
from bson import ObjectId   # permite manejar IDs de MongoDB
from database.database import tareas_collection, db

# creación del blueprint para las rutas de tareas
task_routes = Blueprint("task_routes", __name__)

# obtener el usuario que hace la petición
def get_user():
    return request.headers.get("X-User")

# Crear tarea 
@task_routes.route("/api/tareas", methods=["POST"])
def crear_tarea():
    user = get_user()
    if not user: return jsonify({"error":"No autorizado"}), 401

    data = request.json   # datos enviados desde el frontend

    # estructura de creación de tarea
    tarea = {
        "usuario": user,
        "board_id": data.get("board_id"),          
        "titulo": data.get("titulo"),
        "descripcion": data.get("descripcion", ""),
        "fecha": data.get("fecha"),                 
        "prioridad": data.get("prioridad", "Media"),
        "estado": data.get("estado", "todo"),       
        "completada": bool(data.get("completada", False))
    }

    res = tareas_collection.insert_one(tarea)  # guardar tarea
    tarea["_id"] = str(res.inserted_id)        # convertir ID en JSON

    return jsonify(tarea), 201


# Obtener tareas 
@task_routes.route("/api/tareas", methods=["GET"])
def obtener_tareas():
    user = get_user()
    if not user: return jsonify([]), 401

    board_id = request.args.get("board_id")  # filtrar por columna

    query = {"usuario": user}                # base de la consulta
    if board_id:
        query["board_id"] = board_id

    tareas = []
    for t in tareas_collection.find(query):  # buscar tareas en DB
        t["_id"] = str(t["_id"])
        tareas.append(t)

    return jsonify(tareas), 200


# Actualizar tarea
@task_routes.route("/api/tareas/<id>", methods=["PUT"])
def actualizar_tarea(id):
    user = get_user()
    if not user: return jsonify({"error":"No autorizado"}), 401

    data = request.json  # datos nuevos de la tarea

    tareas_collection.update_one(
        {"_id": ObjectId(id), "usuario": user}, 
        {"$set": data}
    )  # actualizar únicamente los campos enviados

    t = tareas_collection.find_one({"_id": ObjectId(id)})  # tarea actualizada
    t["_id"] = str(t["_id"])

    return jsonify(t), 200


# Eliminar tarea
@task_routes.route("/api/tareas/<id>", methods=["DELETE"])
def eliminar_tarea(id):
    user = get_user()
    if not user: return jsonify({"error":"No autorizado"}), 401

    tareas_collection.delete_one({"_id": ObjectId(id), "usuario": user})  # borrar tarea

    return jsonify({"mensaje":"eliminada"}), 200


# Calendario
@task_routes.route("/api/calendar", methods=["GET"])
def calendar():
    user = get_user()
    if not user: return jsonify([]), 401

    date = request.args.get("date")  # fecha enviada desde el front
    if not date:
        return jsonify({"error":"date requerido"}), 400

    tareas = []
    for t in tareas_collection.find({"usuario": user, "fecha": date}):  # buscar tareas por fecha
        t["_id"] = str(t["_id"])
        tareas.append(t)

    return jsonify(tareas), 200
