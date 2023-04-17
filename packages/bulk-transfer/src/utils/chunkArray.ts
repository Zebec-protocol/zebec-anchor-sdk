export function chunkArray<T>(arr: Array<T>, chunkSize: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		result.push(arr.slice(i, i + chunkSize));
	}
	return result;
}
