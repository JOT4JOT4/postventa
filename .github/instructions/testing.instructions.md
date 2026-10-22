---
name: Instrucciones de pruebas y calidad
description: Reglas para Jest, ESLint y verificación de cambios.
applyTo: "**/*.{test,spec}.{ts,tsx,js,jsx}"
---

# Pruebas y calidad

- Sigue los patrones de pruebas existentes y usa Jest cuando esté configurado para el paquete afectado.
- Prueba el comportamiento observable, no detalles internos innecesarios.
- Incluye casos exitosos, errores relevantes y validaciones de entrada.
- Aísla las pruebas de servicios externos y evita usar datos reales de producción.
- No elimines ni debilites pruebas para hacer que una ejecución pase.
- Mantén las pruebas deterministas y limpia los recursos creados.
- Ejecuta los comandos de test y lint definidos en los `package.json` correspondientes.
- No declares que las pruebas pasaron si no has revisado la salida real.
- Si falla una prueba, informa del fallo y determina si está relacionado con el cambio o ya existía.
