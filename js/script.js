document.addEventListener("DOMContentLoaded", () => {

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


            /* Acá, cuando haya backend, se puede
               enviar el formulario con fetch() antes
               de mostrar el mensaje de éxito */

            registrationForm.classList.add("hidden");
            registrationSuccess.classList.remove("hidden");

            registrationSuccess.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    }

});