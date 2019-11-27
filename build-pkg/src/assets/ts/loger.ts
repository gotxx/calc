class Task {
	id: number;
	start: object;
	finish: object;
	timer: number;
	elapsedTime: number;
	elapsedTimeString: string;
	title: string;
	description: string;

	constructor(id: number, title: string, description: string){
		this.id = id;
		this.start = new Date();
		this.finish = null;
		this.timer = 0;
		this.title = title;
		this.description = description;
		this.elapsedTime = 0;
		this.elapsedTimeString = '';
	}

	startTimer(){
		this.timer = setInterval( () => {
			this.elapsedTime = this.elapsedTime + 1000;
			let	current = new Date(this.elapsedTime - (1000*60*60)),
				s = current.getSeconds(),
				ss = s < 10 ? `0${s}` : s,
				m = current.getMinutes(),
				mm = m < 10 ? `0${m}` : m,
				h = current.getHours(),
				hh = h < 10 ? `0${h}` : h,
				time = `${hh}:${mm}:${ss}`;
				this.updateTask(this.id, time);
				this.elapsedTimeString = time;
		}, 1000);
	}

	finishTimer(){
		clearInterval(this.timer);
	}

	updateTask(id, time){
		// console.log(id);
		let element = document.querySelector('[data-task-id="'+id+'"]'),
			clock = element.querySelector('.js-clock');

		clock.innerHTML = ' - '+time;
	}

}

class Loger {
	id: number;
	selector: HTMLElement;
	listWrapper: HTMLElement;
	tasks: Array<Task>;

	constructor(selectorString: string){
		this.selector = document.querySelector(selectorString);
		this.listWrapper = document.querySelector('#task-list');
		this.tasks = [];
		this.id = 0;
	}

	events(): void {
		this.selector.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();

			let target: any = event.target,
				classArray = target.classList,
				classArrayLength = classArray.length,
				lastClass = classArray[classArrayLength-1],
				id = target.parentElement.dataset.taskId;

				// console.log(lastClass);

			switch(lastClass) {
				case 'js-add-task':
					this.addTask();
					break;
				case 'js-remove-task':
					this.removeTask(id);
					break;

				case 'js-finish-task':
					this.finishTask(id);
					break;
			}

			this.render();
		});
	}

	addTask(): void {
		let title = (<HTMLInputElement>document.getElementById('task-title')).value,
			titleStr = title != '' ? title : `Title ${this.id}`,
			desc = (<HTMLInputElement>document.getElementById('task-description')).value,
			descStr = desc != '' ? desc : 'Lorem ipsum dolor sit amet.',
			task = new Task( this.id, titleStr, descStr );

		task.startTimer();
		this.tasks.push( task );
		this.id++;
		// console.log(this.tasks);
	}

	removeTask(id: number) {
		let toFinish = this.tasks.filter( task => {
			return task.id == id;
		});

		let index = this.tasks.indexOf(toFinish[0]);
		this.tasks[index].finishTimer();

		this.tasks = this.tasks.filter( task => {
			return task.id != id;
		});

		// let index = this.tasks.indexOf(toFinish[0]);
		// this.tasks[index].finishTimer();
	}

	finishTask(id: number){
		let toFinish = this.tasks.filter( task => {
			return task.id == id;
		});

		let index = this.tasks.indexOf(toFinish[0]);

		this.tasks[index].finish = new Date();
		this.tasks[index].finishTimer();
	}

	countTasks() {
		return this.tasks.length;
	}

	render(){
		let tpl = '',
			arr = this.tasks;
		for(let i = 0, len = this.countTasks(); i < len; i++ ) {
			tpl += template.task(arr[i].id, arr[i].title, this.formatDate(arr[i].start), this.formatDate(arr[i].finish), arr[i].description, arr[i].elapsedTimeString)
		}
		this.listWrapper.innerHTML = tpl;
	}

	formatDate( date ) {
		if(date !== null){
			let currentdDate = date.toISOString().substr(0,10),
				currentTime = date.toISOString().substr(11,8);
			return `${currentdDate} ${currentTime}`;
		} else {
			return ``;
		}
	}
}

const template = {
	task: (id: number, title: string, startDate: string, finishDate: string, description: string, elapsedTimeString: string) => {
		return 	`<div class="list-group-item js-task" data-task-id="${id}">
					<div class="list-group-item-heading clearfix">
						<h2 class="pull-left">${title} <small class="js-clock">${template.timer(elapsedTimeString)}</small></h2>
						<div class="pull-right">
							<h4>
								<div class="label label-primary">
									START: <time date-time="${startDate}">${startDate}</time>
								</div>
							</h4>
							<h4>
								${template.finish(finishDate)}
							</h4>

						</div>
					</div>
					<p>${description}</p>
					<a href="#" class="btn btn-warning btn-sm js-finish-task">Finish Task</a>
					<a href="#" class="btn btn-danger btn-sm js-remove-task">Remove Task</a>
				</div>`;
	},
	finish: (finishDate) => {
		if(finishDate !== '') {
			return `<div class="label label-success">
						FINISH: <time date-time="${finishDate}">${finishDate}</time>
					</div>`;
		} else {
			return ``;
		}
	},
	timer: (time) => {
		return ' - '+time;
	}

};

export { Task, Loger }