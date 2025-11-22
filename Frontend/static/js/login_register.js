// Buttons
const btnLogin = document.getElementById("btn-login");
const btnRegister = document.getElementById("btn-register");
const slider = document.querySelector(".slider");

// Forms
const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");

// Switcher animation
btnLogin.onclick = () => {
  btnLogin.classList.add("active");
  btnRegister.classList.remove("active");
  slider.style.left = "0%";
  formLogin.classList.add("active");
  formRegister.classList.remove("active");
};

btnRegister.onclick = () => {
  btnRegister.classList.add("active");
  btnLogin.classList.remove("active");
  slider.style.left = "50%";
  formRegister.classList.add("active");
  formLogin.classList.remove("active");
};

// Backend routes
const LOGIN_API = "/api/usuarios/login";
const REGISTER_API = "/api/usuarios/registro";

// LOGIN REQUEST
document.getElementById("login-submit").onclick = async () => {
  const correo = document.getElementById("login-email").value;
  const clave = document.getElementById("login-password").value;

  const res = await fetch(LOGIN_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, clave })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("fm_usuario", JSON.stringify(data.usuario));
    window.location.href = "/dashboard";
  } else {
    alert(data.error);
  }
};

// REGISTER REQUEST
document.getElementById("register-submit").onclick = async () => {
  const nombre = document.getElementById("reg-nombre").value;
  const correo = document.getElementById("reg-email").value;
  const clave = document.getElementById("reg-password").value;

  const res = await fetch(REGISTER_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, correo, clave })
  });

  const data = await res.json();

  if (res.ok) {
    alert("✔ Cuenta creada correctamente\nAhora inicia sesión");
    btnLogin.click();
  } else {
    alert(data.error);
  }
};
