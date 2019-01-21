export function addSelectors(selectorStr: string) {

	let selector = selectorStr.indexOf('#') !== -1 ? selectorStr.replace('#', '') : selectorStr.indexOf('.') ? selectorStr.replace('.','') : selectorStr,
		id = selectorStr.indexOf('#') !== -1 ? selectorStr : `#${selectorStr}`, 
		// appRootGetElementById = document.getElementById(selector),
		// appRootQuerySelector = document.querySelector(id),
		appRootGetElementById = document.getElementById('app-component'),
		
		appRootQuerySelector = document.querySelector('#app-component');


	console.log(appRootGetElementById);
	console.log(`^-- to jest getElementById --^`);
	console.log(appRootQuerySelector);
	console.log(`^-- to jest querySelector --^`);

	return appRootGetElementById;
}