let ex=[];

fetch('exercises.json').then(r=>r.json()).then(d=>{
ex=d;
if(document.getElementById('lib')){
document.getElementById('lib').innerHTML =
d.map(e=>e.name+" ("+e.type+")").join("<br>");
}
});

function generate(){
let obj=document.getElementById('objectif').value;
let niv=document.getElementById('niveau').value;

let prog=ex.filter(e=>e.type==obj && e.level==niv);

let formatted=prog.map(e=>
e.name+" - "+e.series+" séries - "+e.reps+" - repos "+e.rest);

localStorage.setItem("prog_user",JSON.stringify(formatted));

document.getElementById("result").innerHTML=
formatted.join("<br>");
}

function load(){
let data=JSON.parse(localStorage.getItem("prog_user"));
document.getElementById("prog").innerHTML=data.join("<br>");
}
