declare module "maplibre-gl/dist/maplibre-gl-csp-worker?worker" {
    const WorkerFactory: {
        new(): Worker;
    };
    export default WorkerFactory;
}
