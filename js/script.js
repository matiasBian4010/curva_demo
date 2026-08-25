/* =========================================================
   CONFIGURACIÓN DE EMAILJS
   Reemplazá estos 3 valores por los que te da tu cuenta
   de emailjs.com (Service ID, Template ID y Public Key).
========================================================= */
 
const EMAILJS_PUBLIC_KEY = "kgPw6kM3Wj3gOPyA7";
const EMAILJS_SERVICE_ID = "service_fogvg9d";
const EMAILJS_TEMPLATE_ID = "template_byi3i6z";
 
 
document.addEventListener("DOMContentLoaded", () => {
 
    /* Inicializa EmailJS solo si hay una public key cargada */
    if (
        typeof emailjs !== "undefined" &&
        EMAILJS_PUBLIC_KEY &&
        EMAILJS_PUBLIC_KEY !== "kgPw6kM3Wj3gOPyA7"
    ) {
 
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
 
    }
 
 
    /* =====================================================
       MENÚ MOBILE
    ===================================================== */
 
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");
 
    if (menuToggle && navMenu) {
 
        menuToggle.addEventListener("click", () => {
 
            navMenu.classList.toggle("active");
 
        });
 
 
        const navLinks = navMenu.querySelectorAll("a");
 
        navLinks.forEach(link => {
 
            link.addEventListener("click", () => {
 
                navMenu.classList.remove("active");
 
            });
 
        });
 
    }
 
 
    /* =====================================================
       FILTRO DE HORARIOS
    ===================================================== */
 
    const filterButtons =
        document.querySelectorAll(".filter-btn");
 
    const scheduleItems =
        document.querySelectorAll(".schedule-item");
 
    const scheduleDays =
        document.querySelectorAll(".schedule-day");
 
 
    if (filterButtons.length > 0) {
 
        filterButtons.forEach(button => {
 
            button.addEventListener("click", () => {
 
                const filter =
                    button.dataset.filter;
 
 
                /* Cambiar botón activo */
 
                filterButtons.forEach(btn => {
 
                    btn.classList.remove("active");
 
                });
 
                button.classList.add("active");
 
 
                /* Mostrar / ocultar actividades */
 
                scheduleItems.forEach(item => {
 
                    const activity =
                        item.dataset.activity;
 
 
                    if (
                        filter === "all" ||
                        activity === filter
                    ) {
 
                        item.classList.remove("hidden");
 
                    } else {
 
                        item.classList.add("hidden");
 
                    }
 
                });
 
 
                /* Ocultar días sin resultados */
 
                scheduleDays.forEach(day => {
 
                    const visibleItems =
                        day.querySelectorAll(
                            ".schedule-item:not(.hidden)"
                        );
 
 
                    if (visibleItems.length === 0) {
 
                        day.classList.add("hidden");
 
                    } else {
 
                        day.classList.remove("hidden");
 
                    }
 
                });
 
            });
 
        });
 
    }
 
 
    /* =====================================================
       FILTRO DESDE URL
       Ejemplo:
       horarios.html?actividad=pilates
    ===================================================== */
 
    const params =
        new URLSearchParams(window.location.search);
 
    const activityFromURL =
        params.get("actividad");
 
 
    if (activityFromURL && filterButtons.length > 0) {
 
        const matchingButton =
            document.querySelector(
                `.filter-btn[data-filter="${activityFromURL}"]`
            );
 
 
        if (matchingButton) {
 
            matchingButton.click();
 
        }
 
    }
 
 
    /* =====================================================
       FORMULARIO DE REGISTRO
    ===================================================== */
 
    const registrationForm =
        document.getElementById("registrationForm");
 
    const registrationSuccess =
        document.getElementById("registrationSuccess");
 
    const submitBtn =
        document.getElementById("submitBtn");
 
    const formError =
        document.getElementById("formError");
 
 
    if (registrationForm && registrationSuccess) {
 
        /* Preseleccionar actividad si viene desde
           registro.html?actividad=pilates */
 
        const actividadSelect =
            registrationForm.querySelector("#actividad");
 
 
        if (activityFromURL && actividadSelect) {
 
            const optionExists =
                Array.from(actividadSelect.options)
                    .some(opt => opt.value === activityFromURL);
 
 
            if (optionExists) {
 
                actividadSelect.value = activityFromURL;
 
            }
 
        }
 
 
        registrationForm.addEventListener("submit", (e) => {
 
            e.preventDefault();
 
 
            if (!registrationForm.checkValidity()) {
 
                registrationForm.reportValidity();
                return;
 
            }
 
 
            if (formError) {
 
                formError.classList.add("hidden");
 
            }
 
 
            /* Si todavía no se cargaron las credenciales de
               EmailJS, avisamos en consola y no rompemos la
               demo: mostramos el éxito igual para poder seguir
               probando el resto del flujo. */
 
            const emailjsListo =
                typeof emailjs !== "undefined" &&
                EMAILJS_PUBLIC_KEY !== "kgPw6kM3Wj3gOPyA7";
 
 
            if (!emailjsListo) {
 
                console.warn(
                    "EmailJS no está configurado todavía. " +
                    "Completá EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID " +
                    "y EMAILJS_TEMPLATE_ID en js/script.js."
                );
 
                registrationForm.classList.add("hidden");
                registrationSuccess.classList.remove("hidden");
 
                registrationSuccess.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
 
                return;
 
            }
 
 
            const formData = new FormData(registrationForm);
 
            const templateParams = {
                nombre: formData.get("nombre"),
                apellido: formData.get("apellido"),
                dni: formData.get("dni"),
                email: formData.get("email"),
                telefono: formData.get("telefono"),
                actividad: formData.get("actividad"),
                horario: formData.get("horario") || "No especificado",
                mensaje: formData.get("mensaje") || "Sin mensaje"
            };
 
 
            if (submitBtn) {
 
                submitBtn.disabled = true;
                submitBtn.textContent = "Enviando...";
 
            }
 
 
            emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            )
                .then(() => {
 
                    registrationForm.classList.add("hidden");
                    registrationSuccess.classList.remove("hidden");
 
                    registrationSuccess.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
 
                })
                .catch((error) => {
 
                    console.error("Error al enviar el registro:", error);
 
                    if (formError) {
 
                        formError.classList.remove("hidden");
 
                    }
 
                })
                .finally(() => {
 
                    if (submitBtn) {
 
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Enviar registro";
 
                    }
 
                });
 
        });
 
    }
 
});
 
