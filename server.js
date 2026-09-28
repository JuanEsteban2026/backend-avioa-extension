 // ==========================================
// ARCHIVO: server.js (BACKEND NODE/EXPRESS)
// ==========================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors()); // Permite peticiones desde la extensión
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/procesar', async (req, res) => {
    try {
        const { texto, plataforma } = req.body;

        if (!texto || !plataforma) {
            return res.status(400).json({ error: 'Faltan datos requeridos (texto o plataforma)' });
        }

        let prompt = "";
        let modeloElegido = "gpt-4o-mini";
        let forzarFormatoJSON = false;

        const instruccionesFormatoLibre = `
        IMPORTANTE - FORMATO LIBRE: El usuario ingresará los datos de forma totalmente libre, desestructurada, con abreviaturas o jerga coloquial.
        TU TAREA ES INTERPRETAR LA INTENCIÓN Y TRADUCIRLA a los valores exactos que acepta la plataforma:
        - GÉNERO: Comprende sinónimos ("Masc", "Hombre", "M", "Niño" -> Masculino/Male; "Fem", "Mujer", "F", "Niña" -> Femenino/Female).
        - DOCUMENTOS: Comprende términos locales ("CC", "Cédula", "DNI", "ID" -> Identidad local; "PP", "Pasaporte" -> Pasaporte).
        - NACIONALIDAD: Convierte siempre gentilicios o abreviaturas al nombre oficial del país (ej. "colombiano" o "col" -> "Colombia").
        - FECHAS: Entiende cualquier formato libre (ej. "20 de agosto 2018", "15/04/85") y aplícale el formato exigido.
        - NOMBRES Y APELLIDOS: Solamente ten en cuenta el primer nombre y el primer apellido. 
        --------------------------------------------------\n`;

        // Aquí pegamos toda la lógica de los prompts que tenías en la extensión
        if (plataforma === "jetsmart") {
            prompt = `${instruccionesFormatoLibre} Analiza para JetSmart. Devuelve JSON estricto. "genero": "Masculino" o "Femenino". "tipo_documento": "DNI/C.I.", "PASAPORTE" o "RUT". "mes_nacimiento": español capitalizado (ej. "Enero"). Faltantes: "". "nombres" y "apellidos": solo el primer nombre y el primer apellido. Texto: "${texto}" Estructura: { "pasajeros": [ { "nombres": "string", "apellidos": "string", "genero": "string", "dia_nacimiento": "string", "mes_nacimiento": "string", "ano_nacimiento": "string", "tipo_documento": "string", "numero_documento": "string", "pais_residencia": "string", "direccion": "string", "correo_electronico": "string", "codigo_pais_telefono": "string", "telefono": "string", "aadvantage": "string" } ] }`;
            forzarFormatoJSON = true;
        } else if (plataforma === "wingo") {
            prompt = `${instruccionesFormatoLibre} Analiza para Wingo (Año 2026). Array JSON estricto, sin markdown. Ten en cuenta en omitir las tildes y letras raras para nombre y apellido y solamente ten en cuenta el PRIMER nombre y el PRIMER apellido, el segundo nombre y el segundo apellido lo OMITES. "genero": "Masculino" o "Femenino". "tipo_pasajero": >=12 "Adulto", 2-11 "Niño", <2 "Infante". "viaja_con": "Adulto 1" si es niño/infante, null si es adulto. "mes_nacimiento": 3 letras ("Ene", "Feb"...). Texto: "${texto}" Estructura Array: [ { "nombre": "", "apellido": "", "genero": "", "tipo_pasajero": "", "viaja_con": "", "dia_nacimiento": "", "mes_nacimiento": "", "ano_nacimiento": "", "tipo_documento": "", "numero_documento": "", "nacionalidad": "", "pais_residencia": "", "correo_electronico": "", "codigo_pais_telefono": "", "telefono": "" } ]`;
            modeloElegido = "gpt-3.5-turbo";
        } else if (plataforma === "avianca") {
            prompt = `${instruccionesFormatoLibre} Analiza para Avianca. JSON estricto. "genero": "Male" o "Female". "dia_nacimiento": solo número, sin ceros (ej. "4"). "mes_nacimiento": minúsculas en español. Año 4 dígitos. Texto: "${texto}" Estructura: { "pasajeros": [ { "nombres": "string", "apellidos": "string", "genero": "string", "dia_nacimiento": "string", "mes_nacimiento": "string", "ano_nacimiento": "string", "nacionalidad": "string" } ] }`;
            forzarFormatoJSON = true;
        } else if (plataforma === "copa") {
            prompt = `${instruccionesFormatoLibre} Analiza para Copa. JSON estricto. "genero": "Masculino" o "Femenino". Mes capitalizado. Año 4 dígitos. Texto: "${texto}" Estructura: { "pasajeros": [ { "nombres": "", "apellidos": "", "genero": "", "dia_nacimiento": "", "mes_nacimiento": "", "ano_nacimiento": "", "nacionalidad": "", "correo": "", "telefono": "", "codigo_pais": "" } ] }`;
            forzarFormatoJSON = true;
        } else if (plataforma === "latam") {
            prompt = `${instruccionesFormatoLibre} Analiza para LATAM. JSON estricto. "genero": "Masculino" o "Femenino". Fecha: "DD-MM-YYYY". Documento: "Cédula de Identidad" o "Pasaporte". Texto: "${texto}" Estructura: { "pasajeros": [ { "nombres": "", "apellidos": "", "genero": "", "fecha_nacimiento": "", "nacionalidad": "", "tipo_documento": "", "numero_documento": "", "aerolinea": "", "viajero_frecuente": "", "correo": "", "telefono": "" } ] }`;
            forzarFormatoJSON = true;
        } else if (plataforma === "viva") {
            prompt = `${instruccionesFormatoLibre} Analiza para Viva. JSON estricto. "genero": "Masculino" o "Femenino". Texto: "${texto}" Estructura: { "pasajeros": [ { "nombres": "", "apellidos": "", "genero": "", "dia_nacimiento": "", "mes_nacimiento": "", "ano_nacimiento": "", "nacionalidad": "", "numero_doters": "", "correo": "", "telefono": "" } ] }`;
            forzarFormatoJSON = true;
        } else if (plataforma === "arajet") {
            prompt = `${instruccionesFormatoLibre} Analiza para Arajet. JSON estricto. "genero": "Male" o "Female". Fecha: "DD/MM/YYYY". "prefijo_telefono": ej. "CO +57". Texto: "${texto}" Estructura: { "pasajeros": [ { "nombres": "", "apellidos": "", "genero": "", "fecha_nacimiento": "", "nacionalidad": "", "correo": "", "prefijo_telefono": "", "telefono": "", "numero_pasaporte": "", "fecha_expiracion_pasaporte": "", "pais_emision_pasaporte": "", "pais_residencia": "" } ] }`;
            forzarFormatoJSON = true;
        } else if (plataforma === "kontroltravel") {
            prompt = `${instruccionesFormatoLibre} Analiza para KontrolTravel. JSON estricto. "saludo": Hombre "MR", Mujer "MRS". Documento: CC/DNI="NI", Pasaporte="PP", otro="ID". Fecha: "DD/MM/YYYY". Texto: "${texto}" Estructura: { "pasajeros": [ { "saludo": "", "nombres": "", "apellidos": "", "tipo_documento": "", "numero_documento": "", "fecha_nacimiento": "", "correo": "", "telefono": "", "pais_residencia": "" } ] }`;
            forzarFormatoJSON = true;
        } else if (plataforma === "priceagencies") {
            prompt = `${instruccionesFormatoLibre} Analiza para PriceAgencies. JSON estricto. "genero": "Masculino" o "Femenino". Fecha: "DD/MM/YYYY". Texto: "${texto}" Estructura: { "pasajeros": [ { "nombres": "", "apellidos": "", "genero": "", "fecha_nacimiento": "", "nacionalidad": "", "tipo_documento": "", "numero_documento": "", "aerolinea": "", "viajero_frecuente": "" } ] }`;
            forzarFormatoJSON = true;
        }

        const requestBody = {
            model: modeloElegido,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1 
        };

        if (forzarFormatoJSON) {
            requestBody.response_format = { type: 'json_object' };
        }

        const chatCompletion = await openai.chat.completions.create(requestBody);
        const textoJSON = chatCompletion.choices[0].message.content.trim();
        
        res.json({ success: true, data: JSON.parse(textoJSON) });

    } catch (error) {
        console.error("Error en OpenAI:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo seguro en http://localhost:${PORT}`);
});

