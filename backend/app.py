# Cargar las librerías necesarias de Flask
from flask import Flask, render_template
from flask_cors import CORS

# Importación de las rutas
from routes.user_routes import user_routes
from routes.task_routes import task_routes

# Creación de Flask y conexion las carpetas del frontend
app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")
CORS(app)

# Registro de todas las rutas del backend
app.register_blueprint(task_routes)
app.register_blueprint(user_routes)

#  Página principal del login 
@app.route('/login')
def home():
    return render_template("login_register.html")

# Página principal del dashboard
@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

from flask import redirect

# Permite acceder a rutas sin .html 
@app.route("/<path:filename>.html")
def remove_html(filename):
    return redirect(f"/{filename}")

# Inicio de aplicación en modo debug
if __name__ == "__main__":
    app.run(debug=True)
