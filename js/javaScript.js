/* =========================
   MENÚ MOBILE
========================= */

const menuButton = document.getElementById("menuButton");
const mobileNav = document.getElementById("mobileNav");

if (menuButton && mobileNav) {

    menuButton.addEventListener("click", () => {

        mobileNav.classList.toggle("open");

    });


    mobileNav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            mobileNav.classList.remove("open");

        });

    });

}


/* =========================
   FILTROS DE HORARIOS
========================= */

const filterButtons =
    document.querySelectorAll(".filter-button");

const scheduleItems =
    document.querySelectorAll(".schedule-item");

if (filterButtons.length > 0) {

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            const selectedFilter =
                button.dataset.filter;


            /* Cambiar botón activo */

            filterButtons.forEach(btn => {

                btn.classList.remove("active");

            });

            button.classList.add("active");


            /* Filtrar actividades */

            scheduleItems.forEach(item => {

                const activity =
                    item.dataset.activity;


                if (
                    selectedFilter === "todos" ||
                    activity === selectedFilter
                ) {

                    item.style.display = "flex";

                } else {

                    item.style.display = "none";

                }

            });


            /*
                Ocultar días que quedan vacíos.
            */

            document
                .querySelectorAll(".day-card")
                .forEach(day => {

                    const visibleItems =
                        day.querySelectorAll(
                            ".schedule-item:not([style*='display: none'])"
                        );

                    if (visibleItems.length === 0) {

                        day.style.display = "none";

                    } else {

                        day.style.display = "grid";

                    }

                });

        });

    });


    /*
        Permite entrar directamente desde:

        horarios.html?actividad=pilates

        por ejemplo.
    */

    const params =
        new URLSearchParams(window.location.search);

    const requestedActivity =
        params.get("actividad");

    if (requestedActivity) {

        const requestedButton =
            document.querySelector(
                `[data-filter="${requestedActivity}"]`
            );

        if (requestedButton) {

            requestedButton.click();

        }

    }

}


/* =========================
   FORMULARIO DE REGISTRO
========================= */

const registrationForm =
    document.getElementById("registrationForm");

const registrationSuccess =
    document.getElementById("registrationSuccess");


if (registrationForm && registrationSuccess) {

    registrationForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            /*
                POR AHORA NO SE ENVÍAN DATOS
                A NINGÚN SERVIDOR.

                En la próxima etapa podemos conectar
                este formulario con:

                - Email
                - Google Sheets
                - Base de datos
                - CRM
                - Automatización
            */


            const formData =
                new FormData(registrationForm);


            const data = {

                nombre:
                    formData.get("nombre"),

                apellido:
                    formData.get("apellido"),

                dni:
                    formData.get("dni"),

                email:
                    formData.get("email"),

                telefono:
                    formData.get("telefono"),

                actividad:
                    formData.get("actividad"),

                horario:
                    formData.get("horario"),

                mensaje:
                    formData.get("mensaje")

            };


            /*
                Para comprobar durante el desarrollo
                qué estamos recibiendo.
            */

            console.log(
                "Registro de Curva:",
                data
            );


            registrationForm.classList.add(
                "hidden"
            );

            registrationSuccess.classList.remove(
                "hidden"
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}