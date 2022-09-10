export async function handle(obj) {
	const response = await obj.resolve(obj.event, {
		ssr: false
	});
	return response;
}
