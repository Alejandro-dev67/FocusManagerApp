from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from database.database import usuarios_collection

user_routes = Blueprint("user_routes", __name__)

# Registro de usuario
@user_routes.route("/api/usuarios/registro", methods=["POST"])
def registrar_usuario():
    data = request.json
    nombre = data.get("nombre")
    correo = data.get("correo")
    clave = data.get("clave")

    if not nombre or not correo or not clave:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if usuarios_collection.find_one({"correo": correo}):
        return jsonify({"error": "El correo ya está registrado"}), 400

    usuario = {
        "nombre": nombre,
        "correo": correo,
        "clave": generate_password_hash(clave)
    }

    usuarios_collection.insert_one(usuario)

    return jsonify({"mensaje": "Usuario registrado correctamente"}), 201


# Login
@user_routes.route("/api/usuarios/login", methods=["POST"])
def login_usuario():
    data = request.json

    correo = data.get("correo")
    clave = data.get("clave")

    usuario = usuarios_collection.find_one({"correo": correo})

    if not usuario or not check_password_hash(usuario["clave"], clave):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    return jsonify({
        "mensaje": "Inicio de sesión exitoso",
        "usuario": {
            "correo": usuario["correo"],
            "nombre": usuario["nombre"]
        }
    }), 200
