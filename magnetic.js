Magnetic = new function() {
  
  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight;
  
  var MAGNETS = 4;
  var PARTICLES_PER_MAGNET = 20;

  var canvas;
  var context;
  var particles = [];
  var magnets = [];
  
  var mouseX = (window.innerWidth - SCREEN_WIDTH);
  var mouseY = (window.innerHeight - SCREEN_HEIGHT);
  var mouseIsDown = false;
  var mouseDownTime = 0;
  
  this.init = function() {
    
    canvas = document.getElementById( 'world' );
    
    if (canvas && canvas.getContext) {
      context = canvas.getContext('2d');
      
      // Register event listeners
      document.addEventListener('mousemove', documentMouseMoveHandler, false);
      document.addEventListener('mousedown', documentMouseDownHandler, false);
      document.addEventListener('mouseup', documentMouseUpHandler, false);
      document.addEventListener('touchstart', documentTouchStartHandler, false);
      document.addEventListener('touchmove', documentTouchMoveHandler, false);
      window.addEventListener('resize', windowResizeHandler, false);
      
      createMagnets();
      
      windowResizeHandler();
      
      setInterval( loop, 1000 / 50 );
    }
  };

  function createMagnets() {
    var w = 300;
    var h = 300;
    
    for (var i = 0; i < MAGNETS; i++) {
      var position = {
        x: ( SCREEN_WIDTH - w ) * 0.5 + (Math.random() * w), 
        y: ( SCREEN_HEIGHT - h ) * 0.5 + (Math.random() * h)
      }
      
      createMagnet( position );
    }
  }
  
  function createMagnet( position ) {
    var m = new Magnet();
    m.position.x = position.x;
    m.position.y = position.y;
    
    magnets.push( m );
    
    createParticles( m.position );
  }

  function createParticles( position ) {
    for (var i = 0; i < PARTICLES_PER_MAGNET; i++) {
      var p = new Particle();
      p.position.x = position.x;
      p.position.y = position.y;
      p.shift.x = position.x;
      p.shift.y = position.y;
      
      particles.push( p );
    }
  }

  function documentMouseMoveHandler(event) {
    mouseX = event.clientX - (window.innerWidth - SCREEN_WIDTH) * 0.5;
    mouseY = event.clientY - (window.innerHeight - SCREEN_HEIGHT) * 0.5;
  }
  
  function documentMouseDownHandler(event) {
    event.preventDefault();
    
    mouseIsDown = true;
    
    if( new Date().getTime() - mouseDownTime < 300 ) {
      // The mouse was pressed down twice with a < 300 ms interval: add a magnet
      createMagnet( { x: mouseX, y: mouseY } );
      
      mouseDownTime = 0;
    }
    
    mouseDownTime = new Date().getTime();
    
    for( var i = 0, len = magnets.length; i < len; i++ ) {
      magnet = magnets[i];
      
      if( distanceBetween( magnet.position, { x: mouseX, y: mouseY } ) < magnet.orbit * 0.5 ) {
        magnet.dragging = true;
        break;
      }
    }
  }
  
  function documentMouseUpHandler(event) {
    mouseIsDown = false;
    
    for( var i = 0, len = magnets.length; i < len; i++ ) {
      magnet = magnets[i];
      magnet.dragging = false;
    }
  }

  function documentTouchStartHandler(event) {
    if(event.touches.length == 1) {
      event.preventDefault();

      mouseX = event.touches[0].pageX - (window.innerWidth - SCREEN_WIDTH) * 0.5;;
      mouseY = event.touches[0].pageY - (window.innerHeight - SCREEN_HEIGHT) * 0.5;
    }
  }
  
  function documentTouchMoveHandler(event) {
    if(event.touches.length == 1) {
      event.preventDefault();

      mouseX = event.touches[0].pageX - (window.innerWidth - SCREEN_WIDTH) * 0.5;;
      mouseY = event.touches[0].pageY - (window.innerHeight - SCREEN_HEIGHT) * 0.5;
    }
  }
  
  function windowResizeHandler() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    
    canvas.style.position = 'absolute';
    canvas.style.left = (window.innerWidth - SCREEN_WIDTH) * 0.5 + 'px';
    canvas.style.top = (window.innerHeight - SCREEN_HEIGHT) * 0.5 + 'px';
  }

  function loop() {
    
    context.fillStyle = 'rgba(22,22,22,.4)';
       context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    
    //context.clearRect(0,0,canvas.width,canvas.height);
    
    var particle, magnet;
    var i, j, ilen, jlen;
    
    // Renders out the magnets
    for( j = 0, jlen = magnets.length; j < jlen; j++ ) {
      magnet = magnets[j];
      
      if( magnet.dragging ) {
        magnet.position.x += ( mouseX - magnet.position.x ) * 0.2;
        magnet.position.y += ( mouseY - magnet.position.y ) * 0.2;
      }
      
      // Increase the size of the magnet center point depending on # of connections
      magnet.size += ( (magnet.connections/3) - magnet.size ) * 0.05;
      magnet.size = Math.max(magnet.size,2);
      
      var gradientFill = context.createRadialGradient(magnet.position.x,magnet.position.y,0,magnet.position.x,magnet.position.y,magnet.size*10);
      gradientFill.addColorStop(0,'rgba(0,200,250,0.2)');
      gradientFill.addColorStop(1,'rgba(0,200,250,0)');
      
      context.beginPath();
      context.fillStyle = gradientFill;
      context.arc(magnet.position.x, magnet.position.y, magnet.size*10, 0, Math.PI*2, true);
      context.fill();
      
      //context.shadowBlur = 3;
      //context.shadowColor = "#44eeee";
      
      context.beginPath();
      context.fillStyle = '#00000000';
      context.arc(magnet.position.x, magnet.position.y, magnet.size, 0, Math.PI*2, true);
      context.fill();
      
      //context.shadowBlur = 0;
      //context.shadowColor = 'rgba(0,0,0,0)';
      
      magnet.connections = 0;
    }
    
    // Renders out the particles
    for (i = 0, ilen = particles.length; i < ilen; i++) {
      particle = particles[i];
      
      var currentDistance = -1;
      var closestDistance = -1;
      var closestMagnet = null;
      
      // For each particle, we check what the closes magnet is
      for( j = 0, jlen = magnets.length; j < jlen; j++ ) {
        magnet = magnets[j];
        
        currentDistance = distanceBetween( particle.position, magnet.position ) - ( magnet.orbit * 0.5 );
        
        if( closestMagnet == undefined || currentDistance < closestDistance ) {
          closestDistance = currentDistance;
          closestMagnet = magnet;
        }
      }
      
      closestMagnet.connections += 1;
      
      var lp = { x: particle.position.x, y: particle.position.y };
      
      // Rotation
      particle.angle += particle.speed;
      
      // Translate towards the magnet position
      particle.shift.x += ( closestMagnet.position.x - particle.shift.x) * particle.speed;
      particle.shift.y += ( closestMagnet.position.y - particle.shift.y) * particle.speed;
      
      // Appy the combined position including shift, angle and orbit
      particle.position.x = particle.shift.x + Math.cos(i + particle.angle) * (particle.orbit*particle.force);
      particle.position.y = particle.shift.y + Math.sin(i + particle.angle) * (particle.orbit*particle.force);
      
      // Limit to screen bounds
      particle.position.x = Math.max( Math.min( particle.position.x, SCREEN_WIDTH ), 0 );
      particle.position.y = Math.max( Math.min( particle.position.y, SCREEN_HEIGHT ), 0 );
      
      // Slowly inherit the cloest magnets orbit
      particle.orbit += ( closestMagnet.orbit - particle.orbit ) * 0.05;
      
      context.beginPath();
      context.fillStyle = particle.fillColor;
      context.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
      context.fill();
    }
  }
  
  function distanceBetween(p1,p2) {
    var dx = p2.x-p1.x;
    var dy = p2.y-p1.y;
    return Math.sqrt(dx*dx + dy*dy);
  }
  
}

function Particle() {
  this.size = 2+Math.random()*4;
  this.position = { x: 0, y: 0 };
  this.shift = { x: 0, y: 0 };
  this.angle = 0;
  this.speed = 0.01+Math.random()*0.03;
  this.force = 1 - (Math.random()*0.05);
  this.fillColor = '#ffffff';
  this.orbit = 1;
}

function Magnet() {
  this.orbit = 100;
  this.position = { x: 0, y: 0 };
  this.dragging = false;
  this.direction = Math.round( Math.random()-0.5 );
  this.connections = 0;
  this.size = 1;
}


Magnetic.init();
  