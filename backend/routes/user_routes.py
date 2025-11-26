# importación de módulos y utilidades 
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

# importación de la colección de usuarios desde la configuración de la base de datos
from database.database import usuarios_collection

# blueprint para rutas de usuario
user_routes = Blueprint("user_routes", __name__)

# Registro de usuario
@user_routes.route("/api/usuarios/registro", methods=["POST"])
def registrar_usuario():
    # obtener datos enviados en JSON
    data = request.json
    nombre = data.get("nombre")
    correo = data.get("correo")
    clave = data.get("clave")

    # validación campos 
    if not nombre or not correo or not clave:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    # verificación del correo
    if usuarios_collection.find_one({"correo": correo}):
        return jsonify({"error": "El correo ya está registrado"}), 400

    # crear documento de usuario con la contraseña hasheada
    usuario = {
        "nombre": nombre,
        "correo": correo,
        "clave": generate_password_hash(clave)
    }

    # insertar usuario en la colección
    usuarios_collection.insert_one(usuario)

    return jsonify({"mensaje": "Usuario registrado correctamente"}), 201


# Login
@user_routes.route("/api/usuarios/login", methods=["POST"])
def login_usuario():
    # obtener credenciales desde JSON
    data = request.json
    correo = data.get("correo")
    clave = data.get("clave")

    # buscar usuario por correo
    usuario = usuarios_collection.find_one({"correo": correo})

    # validar existencia y contraseña
    if not usuario or not check_password_hash(usuario["clave"], clave):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    # devolver datos públicos del usuario (sin la clave)
    return jsonify({
        "mensaje": "Inicio de sesión exitoso",
        "usuario": {
            "correo": usuario["correo"],
            "nombre": usuario["nombre"]
        }
    }), 200
