/** Set up for OpenTelemetry tracing **/
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
    NodeTracerProvider,
    SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { OpenAIInstrumentation } from "@traceloop/instrumentation-openai";

// Initialize tracing only in production or when explicitly enabled
const TRACING_ENABLED = process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_TRACING === 'true';

if (TRACING_ENABLED) {
    const exporter = new OTLPTraceExporter({
        url: "http://localhost:4318/v1/traces",
    });

    const provider = new NodeTracerProvider({
        resource: resourceFromAttributes({
            "service.name": "recoup",
            "service.version": "1.0.0",
        }),
        spanProcessors: [
            new SimpleSpanProcessor(exporter)
        ],
    });

    provider.register();

    registerInstrumentations({
        instrumentations: [new OpenAIInstrumentation()],
    });

    console.log('OpenTelemetry tracing initialized for Recoup');
} else {
    console.log('Tracing disabled (enable with NEXT_PUBLIC_ENABLE_TRACING=true)');
}
/** Set up for OpenTelemetry tracing **/