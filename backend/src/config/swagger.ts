import swaggerJSDoc from "swagger-jsdoc";
import swaagerUi from 'swagger-ui-express';
import { Express } from "express";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Backend API",
            version: "1.0.0",
            description: "Node.js Backend API documentation"
        },
        servers:[
            {
                url: "http://localhost:8000"
            }
        ],
        components: {
            securitySchema: {
                bearerAuth: {
                    type: "http",
                    schema: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ["./src/docs/*.ts"]
};

const specs = swaggerJSDoc(options);

export const swaggerDocs = (app: Express) => {
    app.use(
        "/api-docs",
        swaagerUi.serve,
        swaagerUi.setup(specs)
    )
}