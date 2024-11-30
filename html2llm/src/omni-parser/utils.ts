export async function downloadBinaryFile(path: string): Promise<ArrayBuffer> {
	const response = await fetch(path, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/octet-stream',
			Accept: 'application/octet-stream'
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to download binary file: ${path}`);
	}
	return await response.arrayBuffer();
}

export async function downloadImageFile(path: string): Promise<ImageBitmap> {
	const content = await downloadBinaryFile(path);
	return createImageBitmap(new Blob([content]));
}
