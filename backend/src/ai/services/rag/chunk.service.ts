export interface chunkOptions {
    chunkSize?: number;
    overlap?: number;
}

export const chunkText = (
    text: string,
    options: chunkOptions = {}
): string[] => {
    const chunkSize = options.chunkSize ?? 1000;
    const overlap = options.overlap ?? 200;
    if(!text.trim()) {
        return []
    }
    if(overlap >= chunkSize) {
        throw new Error("Chunk overlap must be smaller than chunk size")
    }

    const chunks: string[] = []
    let start = 0;
    while(start < text.length) {
        const end = Math.min(
            start + chunkSize,
            text.length
        );
        const chunk = text.slice(start, end).trim()
        if(chunk) {
            chunks.push(chunk)
        }

        if(end === text.length) break ;
        start = end - overlap
    }

    return chunks
}