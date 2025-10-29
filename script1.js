const canvas = document.getElementById("canvas"); //referencia al canvas
const ctx = canvas.getContext("2d"); //poder dibujar en el canvas

const menu = document.querySelector(".menu");
const score = document.querySelector(".score");
const canvas2 = document.getElementById("snake-1");
const canvas3 = document.getElementById("snake-2");

const ctx2 = canvas2.getContext("2d");
const ctx3 = canvas3.getContext("2d");

canvas2.width = 190; 
canvas2.height = 80;
canvas3.width = 190; 
canvas3.height = 80;
canvas.width = 850; //ancho
canvas.height = 600; //alto

const soundEat = new Audio("sounds/213446__taira-komori__packun_eating.mp3");
const soundLose = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const enemies = [];
const bgMusic = new Audio("sounds/funny-bgm-240795.mp3");
bgMusic.loop = true; // se repetirá automáticamente
bgMusic.volume = 0.3; // bajar volumen para no opacar efectos


// variables
let play = false;
let scoreP = 0;
let lives = 5; 
let level = 1;
let highScore = localStorage.getItem("highScore") 
    ? parseInt(localStorage.getItem("highScore")) 
    : 0; // guardar puntaje máximo

const highScoreText = document.querySelector(".highScore");
highScoreText.textContent = `🏆: ${highScore}`;

// dibujar comida
class Apple{
    constructor(position,radio,color,context){
        this.position = position;
        this.radio = radio;
        this.color = color;
        this.context = context;
    }
    draw() {
        const ctx = this.context;
        ctx.save();

        // Manzana
        const gradient = ctx.createRadialGradient(
            this.position.x - this.radio / 3, this.position.y - this.radio / 3, this.radio / 6,
            this.position.x, this.position.y, this.radio
        );
        gradient.addColorStop(0, "#ff6666");  // centro brillante
        gradient.addColorStop(1, this.color); // borde más oscuro

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radio, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();

        // Tallo
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y - this.radio);
        ctx.lineTo(this.position.x, this.position.y - this.radio - 10);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#5B3A29"; // color marrón
        ctx.stroke();
        ctx.closePath();

        // Hoja
        ctx.beginPath();
        ctx.ellipse(
            this.position.x + 6, this.position.y - this.radio - 5,
            6, 3, Math.PI / 4, 0, 2 * Math.PI
        );
        ctx.fillStyle = "#4CAF50";
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    }
    collision(snake){     // para detectar colisiones se hace una resta de vectores entre posiciones
        let v1 = {
            x:this.position.x - snake.position.x,
            y:this.position.y - snake.position.y   
        }   
        let distance = Math.sqrt( // sacar magnitud del nuevo vector
            (v1.x*v1.x)+(v1.y*v1.y)
        );

        if(distance < snake.radio + this.radio){   // si se cumple hay colisión
            this.position = {
                x: Math.floor(Math.random() * ((canvas.width - this.radio) - this.radio + 1)) + this.radio, //generar número aleatorio para la nueva posición
                y: Math.floor(Math.random() * ((canvas.height - 50 - this.radio) - this.radio + 1)) + this.radio + 50,
             }
             snake.createBody();
             scoreP++;
             score.textContent = `🍎: ${scoreP}`; // asignar valor al span
             soundEat.play();
             // actualizar puntaje máximo
             if (scoreP > highScore) {
                 highScore = scoreP;
                localStorage.setItem("highScore", highScore); // guardar en memoria
                if (highScoreText) highScoreText.textContent = `🏆: ${highScore}`;
             }
             if(scoreP === 1 && level === 1){ // primer punto en nivel 1
                enemies.push(new Enemy(
                { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
                10, "blue", 1, ctx
                ));
            }
            if (scoreP === 3) {
                level = 2;
                for (let i = 0; i < 3; i++) { // agrega 3 enemigos
                    enemies.push(new Enemy(
                        { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
                        10, "yellow", 1.5, ctx
                    ));
                }
            } else if (scoreP === 10) {
                level = 3;
                for (let i = 0; i < 5; i++) { // agrega más enemigos
                    enemies.push(new Enemy(
                    { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
                    12, "#00ffd5f8", 2, ctx
                    ));
                }
            }
        }
    }
}
// dibujar enemigos
class Enemy {
    constructor(position, radius, color, velocity, context) {
        this.position = position;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.context = context;
        this.direction = Math.random() * Math.PI * 2; // dirección aleatoria
    }

    draw() {
        this.context.save();
        this.context.beginPath();
        this.context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.shadowColor = this.color;
        this.context.shadowBlur = 15;
        this.context.fill();
        this.context.closePath();
        this.context.restore();
    }

    move() {
        this.position.x += Math.cos(this.direction) * this.velocity;
        this.position.y += Math.sin(this.direction) * this.velocity;

        // rebote en los bordes
        if (this.position.x <= this.radius || this.position.x >= canvas.width - this.radius)
            this.direction = Math.PI - this.direction;
        if (this.position.y <= this.radius || this.position.y >= canvas.height - this.radius)
            this.direction = -this.direction;
    }

    collision(snake) {
        // Verificar colisión con la cabeza
        let dx = this.position.x - snake.position.x;
        let dy = this.position.y - snake.position.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + snake.radio) {
            this.handleHit(snake);
            return;
        }

        // Verificar colisión con cada parte del cuerpo
        for (let part of snake.body) {
            for (let p of part.path) {
                let dx2 = this.position.x - p.x;
                let dy2 = this.position.y - p.y;
                let dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                if (dist2 < this.radius + part.radio) {
                    this.handleHit(snake);
                    return;
                }
            }
        }
    }

    // Nueva función auxiliar para evitar repetir código
    handleHit(snake) {
        soundLose.play();
        lives = Math.max(lives - 1, 0); // no negativo
        this.position = {
            x: Math.random() * (canvas.width - this.radius * 2) + this.radius,
            y: Math.random() * (canvas.height - this.radius * 2) + this.radius
        };
        if (lives <= 0) {
            snake.death();
        }
        if (livesText) livesText.textContent = lives;
    }
}

// dibujar cuerpo de la serpiente
class SnakeBody{
    constructor(radio,color,context,path){
        this.radio = radio;
        this.color = color;
        this.context = context;
        this.path = path;
        this.transparency = 1;
    }
    drawCircle(x,y,radio,color){ // dibujar círculo
        this.context.save();
        this.context.beginPath(); // usar begin.path para indicar que crearemos un nuevo dibujo
        this.context.arc(x,y,radio,0,2*Math.PI); //método para dibujar la cabeza de la serpiente (círculo) (x,y,angulo inicial,angulo final (radianes))
        this.context.fillStyle = color;
        this.context.globalAlpha = this.transparency;
        this.context.shadowColor = this.color; // color de la sombra para el brillo
        this.context.shadowBlur = 10; // desenfoque de la sombra
        this.context.fill(); // rellenar círculo
        this.context.closePath(); // terminar dibujo actual
        this.context.restore();
    }
    draw(){ // método para dibujar cuerpo
       this.drawCircle(this.path.slice(-1)[0].x,this.path.slice(-1)[0].y,
            this.radio,this.color);//devuelve el último elemento de la posición del array  
    
    }

}
// dibujar cabeza de la serpiente
class Snake{
    constructor(position, radio, color, velocity, length, pathLength, context){
        this.position = position; // crea propiedades y se le asigna valor po parámetro
        this.radio = radio;
        this.color = color;
        this.velocity = velocity;
        this.context = context;
        this.rotation = 0;
        this.transparency = 1;
        this.body = [];
        this.isDeath = false;
        this.length = length;   // indica que tan pequeño es el camino de la serpiente
        this.pathLength = pathLength;
        this.keys = {  //manejar rotación con teclas
            A:false,
            D:false,
            enable:true
        }
        this.keyboard();
    }
    initBody(){ // método para inicializar cuerpo
        for(let i=0; i<this.length; i++){
            let path = []; // crear un camino por iteración
            for(let k=0; k<this.pathLength; k++){
                path.push({  // crear un objeto y añadir al camino (almacenara posiciones en x,y)
                    x:this.position.x,
                    y:this.position.y
                });
            }
           this.body.push(new SnakeBody(this.radio,this.color,this.context,path)); // crear cuerpo
        }
    }
    createBody(){ // método para agregar cuerpo
        let path = []; // crear un camino por iteración
        for(let k=0; k<this.pathLength; k++){
            path.push({  // crear un objeto y añadir al camino (almacenara posiciones en x,y)
                x:this.body.slice(-1)[0].path.slice(-1)[0].x, // guarda la coordenada del último elemento del cuerpo
                y:this.body.slice(-1)[0].path.slice(-1)[0].y
            });  
        }
        this.body.push(new SnakeBody(this.radio,this.color,this.context,path)); // crear cuerpo
        
        if(this.pathLength < 8){  // valida longitud del camino
           this.body.push(new SnakeBody(this.radio,this.color,this.context,[...path])); // copiar camino para crear y aumentar 3 cuerpos 
           this.body.push(new SnakeBody(this.radio,this.color,this.context,[...path]));
           this.body.push(new SnakeBody(this.radio,this.color,this.context,[...path]));
        }
    }
    drawCircle(x,y,radio,color,shadowColor){ // dibujar círculo
        this.context.save();
        this.context.beginPath(); // usar begin.path para indicar que crearemos un nuevo dibujo
        this.context.arc(x,y,radio,0,2*Math.PI); //método para dibujar la cabeza de la serpiente (círculo) (x,y,angulo inicial,angulo final (radianes))
        this.context.fillStyle = color;
        this.context.globalAlpha = this.transparency; // maneja la transparencia del dibujo
        this.context.shadowColor = shadowColor; // color de la sombra para el brillo
        this.context.shadowBlur = 10; // desenfoque de la sombra
        this.context.fill(); // rellenar círculo
        this.context.closePath(); // terminar dibujo actual
        this.context.restore();
    }
    drawHead(){ // método para dibujar cabeza
        this.drawCircle(this.position.x,this.position.y,this.radio,this.color,this.color);

        this.drawCircle(this.position.x,this.position.y-9,this.radio-4,"white","transparent"); // dibujar ojos
        this.drawCircle(this.position.x+1,this.position.y-9,this.radio-6,"black","transparent");
        this.drawCircle(this.position.x+3,this.position.y-8,this.radio-9,"white","transparent");
        
        this.drawCircle(this.position.x,this.position.y+9,this.radio-4,"white","transparent"); // dibujar ojos
        this.drawCircle(this.position.x+1,this.position.y+9,this.radio-6,"black","transparent");
        this.drawCircle(this.position.x+3,this.position.y+8,this.radio-9,"white","transparent");
        
    }
    drawBody(){ // método para dibujar cuerpo
        this.body[0].path.unshift({ // agregar la posición actual al principio del camino
            x:this.position.x,
            y:this.position.y
        }); 
        this.body[0].draw(); // dibujar

        for(let i = 1; i< this.body.length; i++){ // conectar todas las partes del cuerpo
           // this.body[i-1].path.pop(); // accedemos al camino del cuerpo que va por delante y eliminamos su último elemento
           this.body[i].path.unshift(this.body[i-1].path.pop()); // lo agregamos al principio del camino del cuerpo actual
           this.body[i].draw(); 
        }
        this.body[this.body.length-1].path.pop();// al último elemento de todo el cuerpo lo eliminamos
    }
    draw(){ // método para dibujar serpiente
        this.context.save(); // guarda estado actual del contexto
        
        this.context.translate(this.position.x,this.position.y); //traslada a la posición actual de la serpiente
        this.context.rotate(this.rotation); // rotar de acuerdo al valor de la propiedad
        this.context.translate(-this.position.x,-this.position.y); //trasladar a su posición original
        this.drawHead();

        this.context.restore(); // restaura el estado del contexto al estado guardado
    }
    update(){ // método para actualizar la lógica de la serpiente
        if(this.isDeath){
            this.transparency -=0.02;
            if(this.transparency <= 0){
                play = false;
                menu.style.display = "flex"; // mostrar menú
                return;
            }
        }

        this.drawBody();
        this.draw();
        if(this.keys.A && this.keys.enable){
            this.rotation -=0.04;
        }    
        if(this.keys.D && this.keys.enable){
            this.rotation +=0.04;
        }
        this.position.x += Math.cos(this.rotation)*this.velocity;
        this.position.y += Math.sin(this.rotation)*this.velocity;
    } 
    collision(){ // método para que la serpiente no sobrepase los límites del canva
        if(this.position.x-this.radio <= 0 || 
            this.position.x+this.radio >= canvas.width ||
            this.position.y-this.radio <= 0 ||
            this.position.y+this.radio >= canvas.height){
            
            lives = Math.max(lives - 1, 0);  // evitar que sea negativo
            soundLose.play();
            if (lives > 0){
                this.position = { x: canvas.width / 2, y: canvas.height / 2 };
                this.rotation = 0;
                this.velocity = 1.5;
            } else {
                this.death();
            }
            if (livesText) livesText.textContent = lives;
        }
        
    }
    death(){  // método para animar muerte
        this.velocity = 0;  // detiene la serpiente
        this.keys.enable = false; // no permite rotar la cabeza
        this.isDeath = true; // indicar que la serpiente murió
        this.body.forEach((b)=>{
            let lastItem = b.path[b.path.length-1];  // obtenemos el último elemento del camino del cuerpo
            for(let i = 0; i < b.path.length; i++){ // se recorre el arreglo para que tosas las posiciones del camino sean idénticas al último elemento que tenía
                b.path[i] = lastItem;
            }
            b.transparency = this.transparency;
            bgMusic.pause();
            bgMusic.currentTime = 0; // reinicia música si se quiere reproducir de nuevo
        });
    }
    drawCharacter(){   // método para dibujar personaje
        for(let i=1; i<= this.length; i++){
            this.drawCircle(
                this.position.x - (this.pathLength*this.velocity*i),
                this.position.y, this.radio, this.color, this.color
                );
        }
        this.drawHead();
    }
    keyboard(){ // nuevo objeto
        document.addEventListener("keydown",(evt)=>{ // evento que verifica si se presiono la tecla
            if(evt.key == "a" || evt.key == "A"){
                this.keys.A = true;
            }  
            if(evt.key == "d" || evt.key == "D"){
                this.keys.D = true;
            }
        });
        document.addEventListener("keyup",(evt)=>{ // evento que verifica si se dejo de presiono la tecla
            if(evt.key == "a" || evt.key == "A"){
                this.keys.A = false;
            }  
            if(evt.key == "d" || evt.key == "D"){
                this.keys.D = false;
            }
        }); 
    } 
}

// crear serpientes 
const snake = new Snake({x:200,y:200},11,"#FEBA39",1.5,3,12,ctx);// crear objeto de la clase snake (parámetros)
snake.initBody();
const snakeP1 = new Snake({x:165,y:40},11,"#FEBA39",1.5,8,12,ctx2);
snakeP1.initBody();
snakeP1.drawCharacter();
const snakeP2 = new Snake({x:165,y:40},11,"#88FC03",1.5,24,4,ctx3);
snakeP2.initBody();
snakeP2.drawCharacter();

const apple = new Apple({x:300,y:300},8,"red",ctx);

canvas2.addEventListener("click",()=>{
    init(3,12,"#FEBA39");
})
canvas3.addEventListener("click",()=>{
    init(8,4,"#88FC03")
})
function init(length, pathLength, color){   // modificar características de la serpiente principal para crear el personaje seleccionado
    snake.body.length = 0;
    snake.color = color;
    snake.length = length;
    snake.pathLength = pathLength;
    snake.position = {x:200,y:200};
    snake.isDeath = false;
    snake.velocity = 1.5;
    snake.transparency = 1;
    snake.initBody();
    snake.keys.enable = true;
    play = true;
    menu.style.display = "none"; // método para mostrar menú
    lives = 5;
    scoreP = 0; // al iniciar juego se inicializa en 0
    score.textContent = `🍎: ${scoreP}`;
    level = 1;
    enemies.length = 0;
    if (livesText) livesText.textContent = lives; // actualizar visualmente
    bgMusic.play().catch(e => console.log("La reproducción automática fue bloqueada:", e));
}
function background(){   // función para determinar el color del fondo
    if (level === 1) {
        ctx.fillStyle = "#101C30"; // indica color del dibujo
    } else if (level === 2) {
        ctx.fillStyle = "#132A13"; // verde oscuro
    } else if (level === 3) {
        ctx.fillStyle = "#301030"; // morado oscuro
    }

    ctx.fillRect(0, 0, canvas.width, canvas.height); //este método recibe posiciones iniciales x, y, alto y ancho
    for (let i = 0; i < canvas.height; i += 80) {
        for (let j = 0; j < canvas.width; j += 80) { // recorre el canvas y dibuja pequeños cuadrados
            ctx.fillStyle = level === 1 ? "#23253C" :
                            level === 2 ? "#1F4E1F" : "#502050";
            ctx.fillRect(j + 10, i + 10, 70, 70);
        }
    }
}

function update(){
    background();
    if(play){
        snake.update();
        snake.collision();
        apple.draw(update);
        apple.collision(snake);

        // enemigos activos
        enemies.forEach(e => {
            e.move();
            e.draw();
            e.collision(snake);
        });
    }
    requestAnimationFrame(update); // recibe una función y la ejecuta justo antes del próximo repintado de pantalla
}
update();