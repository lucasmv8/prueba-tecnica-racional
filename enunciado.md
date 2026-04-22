🧪 Desafío Racional · Software Engineer

Este desafío busca evaluar tu capacidad técnica, criterio de producto y enfoque en experiencia de usuario. Queremos saber cómo piensas, cómo comunicas tus decisiones y cómo usas herramientas modernas para crear soluciones efectivas.

**Tienes 72 horas para enviarlo** desde que lo recibes. Mándalo por email a rgalvez@racional.cl con el asunto: Desafío Racional - <Tu Nombre>. 

- Puedes usar la herramienta de I.A. que quieras.
- Nos interesa la calidad y el estándar que tu mismo establezcas.

---

## 1.- Crea una API de inversión

En Racional, buscamos ofrecer a nuestros usuarios una experiencia de inversión transparente, ágil y basada en datos. Como parte de nuestro crecimiento, queremos que propongas y desarrolles una nueva API que permita a los usuarios interactuar directamente con sus inversiones: registrar depósitos y retiros, operar acciones, y visualizar la evolución de sus portafolios.

1. Registrar una depósito/retiro (ambas son requeridas) de un usuario (monto + fecha)
2. Registra una orden de compra/venta (ambas son requeridas) de una Stock
3. Edita información personal del usuario
4. Edita información del portafolio del usuario
5. Consultar el total de un portafolio de un usuario.
6. Consultar los últimos movimientos del usuario

### Consideraciones:

- Puedes usar Firestore, PostgreSQL u otra base de datos a elección
- Define el modelo de datos que consideres más apropiado.
- La API puede estar escrita en el lenguaje/framework que domines.

### Entregable:

- Código fuente (puede ser un drive o repo en github) y README con, al menos:
    - Instrucciones para ejecutar la API.
        - Rutas de la API
    - Descripción de tu modelo de datos y justificación de decisiones.
    - En caso que aplique: uso de I.A: explícanos como la integraste en tu flujo de trabajo, toma de decisiones u otros (agrega todo lo que consideres pertinente)
    

---

## 2.- Tus inversiones, en tiempo real

Una de las experiencias más valoradas por nuestros usuarios es la posibilidad de visualizar, en tiempo real, cómo evoluciona su portafolio de inversión. Esta funcionalidad no solo aporta transparencia, sino también confianza en el uso de Racional como plataforma.

Para esto, se requiere que implementes una visualización interactiva basada en los datos que se encuentran en Firestore.

### Requisitos:

1. Debes conectarte a Firestore usando la siguiente `config.js`

```tsx
const firebaseConfig = {
	apiKey: "AIzaSyArGiRgGd2MfE65_9sjE2QX49gt1sP0GmA",
	authDomain: "racional-exam.firebaseapp.com",
	databaseURL: "<https://racional-exam.firebaseio.com>",
	projectId: "racional-exam",
	storageBucket: "racional-exam.appspot.com",
	messagingSenderId: "669314004725",
	appId: "1:669314004725:web:48bd14a97d7db43c91f7bc"
};
```

1. Escuchar el documento: `investmentEvolutions/user1`
2. Mostrar un gráfico claro que refleje los datos en tiempo real.
3. Da rienda suelta a tu creatividad, debes ser capaz de lograr un entregable que cumpla tu propio estándar de calidad y con foco en la experiencia de usuario
4. Tendremos una mini demo en la que deberás presentar tu desafío a un miembro adicional del team Racional

### Herramientas permitidas:

- Frameworks: React, Angular, Vue, etc. o Vanilla JS
- Librerías: Chart.js, D3, Chartist-js, etc.

### Entregable:

Código fuente (puede ser un drive o repo en github) y README con, al menos:

- En caso que aplique: uso de I.A: explícanos como la integraste en tu flujo de trabajo, toma de decisiones u otros (agrega todo lo que consideres pertinente)

---

## Formato de entrega

Archivos organizados en carpetas:

- `/racional-api`
- `/racional-app`

---

¡Suerte!