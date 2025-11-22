# backend/app.py
from flask import Flask, render_template
from flask_cors import CORS
from routes.user_routes import user_routes
from routes.task_routes import task_routes

app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")
CORS(app)

# Registrar las rutas del backend
app.register_blueprint(task_routes)
app.register_blueprint(user_routes)

# 🔹 Rutas del frontend
@app.route('/login')
def home():
    return render_template("login.html")

@app.route("/register")
def register():
    return render_template("register.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

from flask import redirect

# 🔹 Redirigir URLs con .html a la versión sin extensión
@app.route("/<path:filename>.html")
def remove_html(filename):
    return redirect(f"/{filename}")

if __name__ == "__main__":
    app.run(debug=True)

