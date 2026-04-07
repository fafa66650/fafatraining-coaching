function generate(){
let prog={exercice:"Squat",series:4,reps:"10-12",repos:"1min30"};
localStorage.setItem("prog_code123", JSON.stringify(prog));
document.getElementById("result").innerHTML="Programme généré (code: code123)";
}
function loadProg(){
let code=document.getElementById("code").value;
let data=JSON.parse(localStorage.getItem("prog_"+code));
if(data){
document.getElementById("prog").innerHTML=data.exercice+" - "+data.series+" séries - "+data.reps+" reps - repos "+data.repos;
}}