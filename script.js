const list = document.getElementById('job-list');
const mine = document.getElementById('my-jobs');
const form = document.getElementById('post-form');
const errorEl = document.getElementById('form-error');

let jobs = JSON.parse(localStorage.getItem('jobs')) || [];
let myJobs = JSON.parse(localStorage.getItem('myJobs')) || [];

function save(){
  localStorage.setItem('jobs', JSON.stringify(jobs));
  localStorage.setItem('myJobs', JSON.stringify(myJobs));
}

function render(){
  list.innerHTML = jobs.map(j => `
    <div class="card">
      <b>${j.title}</b> — ${j.price} ISK
      <p>${j.details || ''}</p>
      <button onclick="makeOffer(${j.id})">Make Offer (5% fee)</button>
    </div>`).join('');
  mine.innerHTML = myJobs.map(j => `<li>${j.title} — ${j.price} ISK</li>`).join('');
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const title = form.title.value.trim();
  const price = parseInt(form.price.value, 10);
  if(!title || isNaN(price) || price <= 0){
    errorEl.textContent = 'Please enter a title and a valid price.';
    return;
  }
  const details = form.details.value.trim();
  const job = { id: Date.now(), title, price, details };
  jobs.push(job);
  myJobs.push(job);
  save();
  form.reset();
  errorEl.textContent = '';
  render();
});

function makeOffer(id){
  const j = jobs.find(x => x.id === id);
  if(!j) return;
  const fee = Math.round(j.price * 0.05);
  alert(`Offer sent: ${j.price + fee} ISK (includes 5% fee = ${fee} ISK)`);
}

render();
