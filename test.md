**Sistema de Gestión de Reservas para Espacios de Trabajo (Frontend + IoT)**
Se está creando una aplicación para la gestión de reservas en un espacio de coworking.
El sistema deberá permitir a los clientes reservar salas de reuniones o áreas de trabajo
compartido. Estas reservas se deben realizar a través de de una aplicación que permita
realizar el proceso de reservas y comunicarse con el backend encargado de la lógica de la
aplicación.
**Requerimientos Funcionales**
● Desarrollar una interfaz de usuario que permita a los usuarios:
○ Visualizar la lista de espacios disponibles (GET /espacios).
○ Visualizar las reservas existentes, con paginación (GET /reservas).
○ Crear nuevas reservas (POST /reservas).
○ Visualizar los detalles de un espacio específico.
○ Eliminar reservas.
○ (Bonus) Sección exclusiva para administradores, que les permita ver un
dashboard que se actualice en tiempo real con la telemetría de los
dispositivos de los espacios. La guía backend incluye una sección bonus (en
la última página) que específica los requerimientos en términos del aspecto
IoT de la prueba.
● Implementar la lógica necesaria para interactuar con los endpoints del API
especificados en el documento.
● Manejar los posibles errores de la API y proporcionar retroalimentación adecuada al
usuario.
● Utilizar componentes y hooks de React.
● Manejar el estado de la aplicación de forma eficiente.

● Implementar validaciones básicas en los formularios (creación de reservas).
● Manejo de la API Key enviada desde el back end, para la autenticación de cada
Endpoint.
● Correcta gestión de errores, para dar feedback al usuario, si una petición, no se
realiza correctamente.
**Requerimientos No Funcionales y Técnicos**

1. Documentación
   El proyecto debe incluir un README claro y detallado con instrucciones precisas de cómo
   levantar y probar la aplicación, incluyendo pasos para la configuración, instalación de
   dependencias y ejecución.
2. Uso de contenedores (opcional, puntos extras)
   Se valorará el uso de Docker y docker-compose para facilitar el despliegue de la
   aplicación.
3. Manejo de Errores y Presentación:
   El sistema debe tener funcionalidades para manejar los errores que puedan ocurrir dentro
   del mismo proyecto y las consultas a la API desarrollada. Se evaluará la claridad y la
   presentación de esta información.
   **Consideraciones Adicionales**

● Es importante la documentación de los pasos realizados, para el levantamiento de
la aplicación de React.
● Se valorará la claridad y limpieza del código, así como la separación de
responsabilidades. Utiliza buenas prácticas en la organización del proyecto y en la
escritura de código.
**Entrega**
● Entregar el proyecto en un repositorio (por ejemplo, en GitHub) con el README y la
estructura de carpetas bien definida.
● Incluir instrucciones precisas para la ejecución de la aplicación y la ejecución de los
tests.
● La prueba tiene como máximo una duración de 2 días.
