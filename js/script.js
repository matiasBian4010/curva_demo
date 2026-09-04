/* =========================================================
   CONFIGURACIÓN DE EMAILJS
========================================================= */

const EMAILJS_PUBLIC_KEY = "kgPw6kM3Wj3gOPyA7";
const EMAILJS_SERVICE_ID = "service_fogvg9d";
const EMAILJS_TEMPLATE_ID = "template_byi3i6z";


document.addEventListener("DOMContentLoaded", () => {

    /* Inicializa EmailJS */
    if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY) {

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


                filterButtons.forEach(btn => {

                    btn.classList.remove("active");

                });

                button.classList.add("active");


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


            if (typeof emailjs === "undefined") {

                console.error(
                    "El SDK de EmailJS no se cargó. Revisá que " +
                    "registro.html incluya el <script> de EmailJS."
                );

                if (formError) {

                    formError.classList.remove("hidden");

                }

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

                    const NUMERO_WHATSAPP_CURVA = "5491138007337"; // 11 3800 7337 en formato internacional

                    const mensajeWhatsapp =
                        `Hola! Soy ${templateParams.nombre} ${templateParams.apellido} ` +
                        `(DNI ${templateParams.dni}).\n` +
                        `Me registré para: ${templateParams.actividad}, ` +
                        `${templateParams.frecuencia}.\n` +
                        `Horario preferido: ${templateParams.horario}.\n` +
                        `Mi teléfono: ${templateParams.telefono}.\n` +
                        `Quisiera coordinar el pago para arrancar.`;

                    const linkWhatsapp =
                        `https://wa.me/${NUMERO_WHATSAPP_CURVA}?text=${encodeURIComponent(mensajeWhatsapp)}`;

                    const whatsappBtn = document.getElementById("whatsappConfirmBtn");

                    if (whatsappBtn) {

                        whatsappBtn.href = linkWhatsapp;

                    }

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
