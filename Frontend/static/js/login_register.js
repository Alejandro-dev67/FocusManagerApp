// Botones principales de login y register
const btnLogin = document.getElementById("btn-login");
const btnRegister = document.getElementById("btn-register");
const slider = document.querySelector(".slider");

// Formularios de login y registro
const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");

// Switcher animation (controla el cambio visual entre login y registro)
btnLogin.onclick = () => {
  btnLogin.classList.add("active");
  btnRegister.classList.remove("active");
  slider.style.left = "0%";               // mueve el slider a la posición de Login
  formLogin.classList.add("active");      // muestra el formulario de login
  formRegister.classList.remove("active");// oculta el formulario de registro
};

btnRegister.onclick = () => {
  btnRegister.classList.add("active");
  btnLogin.classList.remove("active");
  slider.style.left = "50%";             // mueve el slider a la posición de Registro
  formRegister.classList.add("active");  // muestra el formulario de registro
  formLogin.classList.remove("active");  // oculta el formulario de login
};

// Rutas de la API del backend
const LOGIN_API = "/api/usuarios/login";
const REGISTER_API = "/api/usuarios/registro";

// LOGIN REQUEST (envía los datos para iniciar sesión)
document.getElementById("login-submit").onclick = async () => {
  const correo = document.getElementById("login-email").value;     // obtiene el correo
  const clave = document.getElementById("login-password").value;   // obtiene la contraseña

  const res = await fetch(LOGIN_API, {
    method: "POST",                                               
    headers: { "Content-Type": "application/json" },           
    body: JSON.stringify({ correo, clave })                       
  });

  const data = await res.json();                                   // respuesta del servidor

  if (res.ok) {
    localStorage.setItem("fm_usuario", JSON.stringify(data.usuario)); // guarda el usuario en localStorage
    window.location.href = "/dashboard";                              // redirige al dashboard
  } else {
    alert(data.error);                                               // muestra mensaje de error
  }
};

// REGISTER REQUEST (envía datos para crear una nueva cuenta)
document.getElementById("register-submit").onclick = async () => {
  const nombre = document.getElementById("reg-nombre").value;    // obtiene nombre
  const correo = document.getElementById("reg-email").value;     // obtiene correo
  const clave = document.getElementById("reg-password").value;   // obtiene contraseña

  const res = await fetch(REGISTER_API, {
    method: "POST",                                               
    headers: { "Content-Type": "application/json" },              
    body: JSON.stringify({ nombre, correo, clave })               
  });

  const data = await res.json();                                  // respuesta del servidor

  if (res.ok) {
    alert("✔ Cuenta creada correctamente\nAhora inicia sesión");  
    btnLogin.click();                                             // mueve el slider a login
  } else {
    alert(data.error);                                        
  }
};
