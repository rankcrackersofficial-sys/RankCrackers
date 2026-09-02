const vision = require('@google-cloud/vision');

async function main() {
    try {
        const client = new vision.ImageAnnotatorClient();
        console.log('Vision client created successfully.');
        // We won't actually call the API here to save quota/avoid errors if not configured,
        // but just checking if the library is loadable and client instantiable.
    } catch (e) {
        console.error('Vision client creation failed:', e.message);
    }
}
main();
