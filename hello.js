/* * * *
Imports
* * * */

d3 = require("d3");
turf = require("turf");
var spawn = require('child_process').spawn;
const Twitter = require("twitter");
const fs = require('fs');
const { createCanvas } = require('canvas');
const request = require('request')
pc = require("./polygonClip.js");
ch = require("./chaikin.js");



/* * * * * * * * * * *
Initialize Global Vars
* * * * * * * * * * */
// don't judge me, it's a twitter bot for crying out loud
var r_max, shape, chaikinIterations, colorby, paletteName, omega, centroids;
var maskpoly, hexarea, hexData, unionPolygon, points_0, n, points;



/* * * * * * * * *
Define Constants
* * * * * * * * */
const w = 1024;
const h = 512;
const m = 30;



/* * * * * * * * *
Helper Functions
* * * * * * * * */
function genHexData(){
  var r_min = r_max*Math.sqrt(3)/2
  var NQ = Math.ceil(w/r_min/3);
  var hexes = [];
  for (var qq=-9*NQ; qq<9*NQ; qq++){
    for (var rr=-9*NQ; rr<9*NQ; rr++){
      var ss = -qq - rr;
      var x = w/2 + r_max * (Math.sqrt(3) * qq  +  Math.sqrt(3)/2 * rr);
      var y = h/2 + r_max * (                                3./2 * rr);
      if (d3.polygonContains(maskpoly, [x, y])){
        hexes.push({q:qq,
                    r:rr,
                    s:ss,
                    x:x,
                    y:y});
      }
    }
  }
  return hexes;
}



function genMaskPoly(){
  var mm;
  if(shape=='Circle'){
    mm = d3.range(0, 6.283,0.01).map(x => [w/2+(h/2-r_max-m)*Math.cos(x),
                                           h/2+(h/2-r_max-m)*Math.sin(x)])
  }else if(shape=='Oval'){
    mm = d3.range(0, 6.283,0.01).map(x => [w/2+(w/2-r_max-m)*Math.cos(x),
                                           h/2+(h/2-r_max-m)*Math.sin(x)])
  }else if(shape=='Rectangle'){
    mm = [[w-r_max-m, r_max+m], [r_max+m, r_max+m], [r_max+m, h-r_max-m], [w-r_max-m, h-r_max-m]]
  }else if(shape=='Diamond'){
    mm = [[w-r_max-m, h/2+r_max],[w-r_max-m, h/2-r_max], [w/2, r_max+m],
          [r_max+m, h/2-r_max], [r_max+m, h/2+r_max], [w/2, h-r_max-m]]
  }else if(shape=='Wave'){
    var xs = d3.scaleLinear().domain([0, 2*Math.PI]).range([r_max+m, w-r_max-m]);
    var top = d3.range(0, 6.283,0.01).map(x => [xs(x), h/2-(h-r_max-m-2*h/3)-h/6*Math.sin(x)])
    var bot = d3.range(0, 6.283,0.01).map(x => [xs(x), h/2+(h-r_max-m-2*h/3)-h/6*Math.sin(x)])
    mm = bot.concat(top.reverse());
  }else if(shape=='Hex1'){
    mm = d3.range(0, 6.283,Math.PI/3).map(x => [w/2+(h/2-r_max-m)*Math.cos(x),
                                                h/2+(h/2-r_max-m)*Math.sin(x)])
  }else if(shape=='Hex2'){
    mm = d3.range(0, 6.283,Math.PI/3).map(x => [w/2+(h/2-r_max-m)*Math.cos(x+Math.PI/6),
                                                h/2+(h/2-r_max-m)*Math.sin(x+Math.PI/6)])
  }
  return mm;
}



function genUnionPolygon(){
    var myPolyUnion = hex2poly(hexData[0], r_max);
    for (var pp=1; pp<hexData.length; pp++){
      myPolyUnion = turf.union(myPolyUnion, hex2poly(hexData[pp], r_max));
    }
    return myPolyUnion.geometry.coordinates[0]
}



function hex2poly(hex, r_max){
  var poly = [];
  for (var ii=1; ii<15; ii+=2) poly.push([Math.round((hex.x+r_max*Math.cos(ii*Math.PI/6))*1e5)/1e5,
                                          Math.round((hex.y+r_max*Math.sin(ii*Math.PI/6))*1e5)/1e5]);
  return(turf.polygon([poly]));
}



function genPalette(){
  if(paletteName == "A"){
    return {base:"#edf6f9", dark:"#006d77", accnt1:"#83c5be", accnt2:"#ffddd2"}
  }else if(paletteName == "B"){
    return {base:"#f4f1de", dark:"#3d405b", accnt1:"#81b29a", accnt2:"#f2cc8f"}
  }else if(paletteName == "C"){
    return {base:"#f4f4f9", dark:"#000000", accnt1:"#586f7c", accnt2:"#b8dbd9"}
  }else if(paletteName == "D"){
    return {base:"#ffffff", dark:"#353535", accnt1:"#284b63", accnt2:"#3c6e71"}
  }else if(paletteName == "E"){
    return {base:"#f2e9e4", dark:"#22223b", accnt1:"#4a4e69", accnt2:"#c9ada7"}
  }else if(paletteName == "F"){
    return {base:"#f4f3ee", dark:"#463f3a", accnt1:"#8a817c", accnt2:"#e0afa0"}
  }else if(paletteName == "G"){
    return {base:"#fefae0", dark:"#283618", accnt1:"#606c38", accnt2:"#bc6c25"}
  }else if(paletteName == "H"){
    return {base:"#ced4da", dark:"#212529", accnt1:"#495057", accnt2:"#f8f9fa"}
  }else if(paletteName == "I"){
    return {base:"#d8dbe2", dark:"#1b1b1e", accnt1:"#a9bcd0", accnt2:"#58a4b0"}
  }else if(paletteName == "J"){
    return {base:"#e8eddf", dark:"#242423", accnt1:"#cfdbd5", accnt2:"#f5cb5c"}
  }else if(paletteName == "K"){
    return {base:"#fddac9", dark:"#5c374c", accnt1:"#ff8c61", accnt2:"#ce6a85"}
  }else if(paletteName == "L"){
    return {base:"#c5e7dd", dark:"#184e77", accnt1:"#1e6091", accnt2:"#d9ed92"}
  }else if(paletteName == "M"){
    return {base:"#edddd4", dark:"#283d3b", accnt1:"#197278", accnt2:"#c44536"}
  }else if(paletteName == "N"){
    return {base:"#fecec2", dark:"#03071e", accnt1:"#6a040f", accnt2:"#f48c06"}
  }else if(paletteName == "O"){
    return {base:"#f7f7ff", dark:"#495867", accnt1:"#577399", accnt2:"#fe5f55"}
  }else if(paletteName == "P"){
    return {base:"#ffffff", dark:"#2d3142", accnt1:"#bfc0c0", accnt2:"#ef8354"}
  }else if(paletteName == "Q"){
    return {base:"#fff0d1", dark:"#1f2041", accnt1:"#119da4", accnt2:"#4b3f72"}
  }else{
    return {base:"#edf6f9", dark:"#006d77", accnt1:"#83c5be", accnt2:"#ffddd2"}
  }
}

function removeDupes(p){
  const t = .01;// threshold
  var p_out = [];
  p_out.push(p[0]);
  for(var ii=1; ii<p.length; ii++){
    var z = p[ii];
    var dists = p_out.map(x => (Math.sqrt(Math.pow(x[0]-z[0],2)+Math.pow(x[1]-z[1],2))));
    var mindist = d3.min(dists);
    if(mindist>t){
      p_out.push(p[ii]);
    }
  }
  return p_out;
}



/* * * * * * * *
Main Functions
* * * * * * * */
function generateParams(){
  const shapes    = ["Circle", "Rectangle", "Oval", "Diamond", "Wave", "Hex1", "Hex2"];
  const colorings = ["area","movement", "nothing", "nothingContrast"];
  const palettes  = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];


  var numHexes = 0;
  while(numHexes<100){
    r_max             = d3.randomInt(10, 30)();
    var shapeIdx          = (Math.random()<0.4) ? 1 : d3.randomInt(7)();
    var chaikinIterations = (Math.random()<0.9) ? 0 : d3.randomInt(0, 4)();
    var colorbyIdx        = (Math.random()<0.8) ? d3.randomInt(2)() : d3.randomInt(4)();
    var paletteIdx        = d3.randomInt(17)();
    var centroids         = (Math.random()<0.2);
    shape = shapes[shapeIdx];
    hexarea       = 3*Math.sqrt(3)/2*(r_max*r_max);
    maskpoly      = genMaskPoly(w, h, m, r_max, shape);
    hexData       = genHexData();
    numHexes      = hexData.length;
  }


  const params      = {
    r_max:                 r_max,
    shape:                 shapes[shapeIdx],
    chaikinIterations:     chaikinIterations,
    centroids:             centroids,
    colorby:               colorings[colorbyIdx],
    paletteName:           palettes[paletteIdx]
  }
  return params;
}



function doParamsConverge(p){
  r_max       = p.r_max;
  shape       = p.shape;

  hexarea       = 3*Math.sqrt(3)/2*(r_max*r_max);
  maskpoly      = genMaskPoly(w, h, m, r_max, shape);
  hexData       = genHexData();
  unionPolygon  = genUnionPolygon();
  points_0 = Float64Array.from({length: hexData.length*2}, (_, i) => (r_max/-2)+r_max*Math.random() + (i & 1 ? h : w) / 2);
  n        = hexData.length*2;
  points   = points_0.slice();
  omega    = Math.min(hexData.length/200,2.5);


  const delaunay = new d3.Delaunay(points);
  const voronoi = delaunay.voronoi([-1000, -1000, w+1000, h+1000]); //bigger box avoids clipping
  let k = 0;
  let converged = false;
  while((k<3800)&(!converged)){ // time loop // limit by 140 seconds * 30 fps

    var maxDist = 0;
    var minArea = w*h*2;
    var maxArea = 0;
    for (let i = 0; i < n; i += 2) { // cell loop
      const cell = voronoi.cellPolygon(i >> 1);
      const cellClipped = pc.polygonClip(cell.reverse(), unionPolygon.reverse());
      if (cell === null) continue;
      const x0 = points[i], y0 = points[i + 1];
      var [x1, y1] = d3.polygonCentroid(cellClipped);
      points[i]     = x0 + (x1 - x0) * omega;
      points[i + 1] = y0 + (y1 - y0) * omega;
      const dist = Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
      maxDist = Math.max(maxDist, dist);
      var NN = cellClipped.length;
      var AA = 0;
      for (var ii=0; ii<(NN-1); ii++){
        AA += (cellClipped[ii][0]*cellClipped[(ii+1) % NN][1] -
               cellClipped[(ii+1) % NN][0]*cellClipped[ii][1])/2
      }
      AA = Math.abs(AA);
      minArea = Math.min(minArea, AA);
      maxArea = Math.max(maxArea, AA);
    } // end cell loop

    if ((maxDist<0.02)&(minArea>(.9999*hexarea))&(maxArea<(1.0001*hexarea))) {
      converged = true;
    }

    voronoi.update();
    k++;
  } // end time loop

  var outcome = {
    isConverged: converged,
    numIterations: k
  }
  return(outcome);
}



function generateFrames(p, o){
  // remove make sure "out" directory exists and is empty
  try {
    fs.rmdirSync('./out/', { recursive: true });
  }catch{}
  fs.mkdirSync('./out/')

  // initialize canvas
  const canvas = createCanvas(w, h);
  const context = canvas.getContext('2d');
  const canvas_base = createCanvas(w, h);
  const context_base = canvas_base.getContext('2d');
  context.lineCap = "round";
  context.lineJoin = "round";


  // initialize params
  r_max             = p.r_max;
  shape             = p.shape;
  chaikinIterations = p.chaikinIterations;
  centroids         = p.centroids;
  colorby           = p.colorby;
  paletteName       = p.paletteName;
  hexarea       = 3*Math.sqrt(3)/2*(r_max*r_max);
  maskpoly      = genMaskPoly(w, h, m, r_max, shape);
  hexData       = genHexData();
  unionPolygon  = genUnionPolygon();
  palette       = genPalette();
  //points_0 are in the global variable from the initial doParamsConverge() check
  n        = hexData.length*2;
  points   = points_0.slice();
  omega    = Math.min(hexData.length/200,2.5);

  if(r_max < 18){
    centroids = false;
  }

  // compute simple color info
  var color_background   = palette.base;
  var color_polygonfill  = palette.base;
  var color_shadow       = palette.dark;
  var color_hexLines     = d3.rgb(palette.base).darker(0.75);
  var color_cellLines    = palette.dark;
  if(colorby == 'nothingContrast'){
    color_background  = palette.dark;
    color_polygonfill = palette.dark;
    color_hexLines     = d3.rgb(palette.dark).brighter(2);
  }
  if(colorby == 'area'){
    var colorScale = d3.scaleLinear()
                      .domain([0, 0.9*hexarea, 0.98*hexarea,
                               hexarea,
                               1.02*hexarea, 1.1*hexarea, 100000]) // area
                      .range([(palette.accnt1+"bb"), (palette.accnt1+"99"), (palette.accnt1+"66"),
                              (palette.base+"33"),
                              (palette.accnt2+"66"), (palette.accnt2+"99"), (palette.accnt2+"bb")])
  }else{
    var colorScale = d3.scaleLinear()
                      .domain([0,0.01*r_max,0.05*r_max,200]) // dist
                      .range(["#ffffff00",
                              (palette.accnt1+"66"),
                              (palette.accnt1+"bb"),
                              (palette.accnt1+"bb")])
  }

  // create base canvas (all others will layer on top)
  context_base.fillStyle = color_background;
  context_base.fillRect(0,0,w,h);
  context_base.fillStyle = color_polygonfill;
  context_base.shadowColor = color_shadow;
  context_base.shadowBlur = m+r_max;
  context_base.beginPath();
  for (var ii=0; ii<unionPolygon.length; ii++){
    context_base.lineTo(unionPolygon[ii][0], unionPolygon[ii][1])
  }
  context_base.fill();
  context_base.shadowBlur = 0;
  context_base.lineWidth = 1;
  for (var hex of hexData){
    context_base.strokeStyle = color_hexLines;
    context_base.beginPath();
    for (var ii=1/6; ii<2.2; ii+=1/3) context_base.lineTo(hex.x+(r_max+0.5)*Math.cos(ii*Math.PI),
                                                          hex.y+(r_max+0.5)*Math.sin(ii*Math.PI));
    context_base.stroke();
    if(centroids){
      context_base.beginPath();
      context_base.arc(hex.x, hex.y, 3, 0, 2 * Math.PI);
      context_base.lineWidth = 2;
      context_base.strokeStyle = color_hexLines;
      context_base.stroke();
    }
  }

  // initialize Simulation
  const delaunay = new d3.Delaunay(points);
  const voronoi = delaunay.voronoi([-1000, -1000, w+1000, h+1000]); //bigger box avoids clipping

  // run Simulation
  for (let k = 0; k < o.numIterations; ++k) {

    // draw the base canvas
    context.drawImage(context_base.canvas,0,0,w,h);
    context.lineWidth = 1;
    context.shadowBlur = 0;

    var maxDist = 0;
    var minArea = w*h*2;
    var maxArea = 0;
    for (let i = 0; i < n; i += 2) {
      const cell = voronoi.cellPolygon(i >> 1);
      const cellClipped = pc.polygonClip(cell.reverse(), unionPolygon.reverse());

      if (cell === null) continue;
      const x0 = points[i], y0 = points[i + 1];
      var [x1, y1] = d3.polygonCentroid(cellClipped);
      points[i]     = x0 + (x1 - x0) * omega;
      points[i + 1] = y0 + (y1 - y0) * omega;
      const dist = Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
      maxDist = Math.max(maxDist, dist);

      var NN = cellClipped.length;
      var AA = 0;
      for (var ii=0; ii<(NN-1); ii++){
        AA += (cellClipped[ii][0]*cellClipped[(ii+1) % NN][1] -
               cellClipped[(ii+1) % NN][0]*cellClipped[ii][1])/2
      }
      AA = Math.abs(AA);

      minArea = Math.min(minArea, AA);
      maxArea = Math.max(maxArea, AA);



      context.beginPath();
      context.strokeStyle = color_cellLines;
      if(colorby == 'area'){
        context.fillStyle = colorScale(AA);
      }else if(colorby == 'movement'){
        context.fillStyle = colorScale(Math.abs(dist));
      }else{
        context.fillStyle = "#ffffff00"
        if(colorby == 'nothingContrast'){
          context.fillStyle   = palette.base+"ff";
          context.strokeStyle = palette.dark;
        }
      }

      var myline = d3.line()
        .curve(d3.curveLinear)
        .x(d => d[0])
        .y(d => d[1])
        .context(context);
      var deduped = removeDupes(cellClipped);
      var chaikinpoly = ch.chaikin(deduped, chaikinIterations);
      chaikinpoly.push(chaikinpoly[0]);
      myline(chaikinpoly);
      context.lineWidth = 3;
      context.fill();
      context.stroke();

      if(centroids){
        context.beginPath();
        context.arc(points[i], points[i+1], 3, 0, 2 * Math.PI);
        context.fillStyle = color_cellLines;
        context.fill();
      }

    } // end cell loop
    context.textAlign = 'end';
    context.fillStyle = color_hexLines;
    context.font = "bold 14px Arial";
    context.fillText("@mattdzugan", w-10, h-28);
    context.fillText("@relaxagons", w-10, h-10);

    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync('./out/frame_'+d3.format("04d")(k)+'.png', buffer)


    voronoi.update();
  } // end time loop

}


function generateVideo(){
  // Forward Video
  var cmd = 'ffmpeg';
  var args = [
      '-y',
      '-r', '60',
      '-f', 'image2',
      '-s', (w+'x'+h),
      '-i', './out/frame_%04d.png',
      '-vcodec', 'libx264',
      '-crf', '15',
      '-pix_fmt', 'yuv420p',
      'forward.mp4'
  ];
  var proc = spawn(cmd, args);
  proc.stdout.on('data', function(data) {
      console.log(data);
  });
  proc.stderr.setEncoding("utf8")
  proc.stderr.on('data', function(data) {
      console.log(data);
  });
  proc.on('close', function() {

    // Reverse Video
    var cmd = 'ffmpeg';
    var args = [
        '-y',
        '-r', '60',
        '-f', 'image2',
        '-s', (w+'x'+h),
        '-i', './out/frame_%04d.png',
        '-vf', 'reverse,setpts=0.05*PTS',
        '-vcodec', 'libx264',
        '-crf', '15',
        '-pix_fmt', 'yuv420p',
        'reverse.mp4'
    ];
    var proc = spawn(cmd, args);
    proc.stdout.on('data', function(data) {
        console.log(data);
    });
    proc.stderr.setEncoding("utf8")
    proc.stderr.on('data', function(data) {
        console.log(data);
    });
    proc.on('close', function() {

      // Combination Video ffmpeg -f concat -i input.txt -codec copy output.mp4
      var cmd = 'ffmpeg';
      var args = [
          '-y',
          '-f', 'concat',
          '-i', 'movieReel.txt',
          '-codec', 'copy',
          'out.mp4'
      ];
      var proc = spawn(cmd, args);
      proc.stdout.on('data', function(data) {
          console.log(data);
      });
      proc.stderr.setEncoding("utf8")
      proc.stderr.on('data', function(data) {
          console.log(data);
      });
      proc.on('close', function() {
          try {
            //fs.rmdirSync('./out/', { recursive: true });
          }catch{}
          console.log('finished');
          postTweet();
      }); // end callback for out.mp4 being done
    }); // end callback for reverse.mp4 being done
  }); // end callback for forward.mp4 being done
}



function postTweet(){

  // twitter creds are stored in env variables
  var oauthCredentials = {
    consumer_key:    process.env.relaxagons_consumer_key,
    consumer_secret: process.env.relaxagons_consumer_secret,
    token:           process.env.relaxagons_access_token_key,
    token_secret:    process.env.relaxagons_access_token_secret
  };

  const client = new Twitter({
    consumer_key:         process.env.relaxagons_consumer_key,
    consumer_secret:      process.env.relaxagons_consumer_secret,
    access_token_key:     process.env.relaxagons_access_token_key,
    access_token_secret:  process.env.relaxagons_access_token_secret,
    request_options: {"timeout": 60*1000}
  });


  //*
  const pathToFile = './out.mp4';
  const filePath = './out.mp4';
  const mediaType = "video/mp4"

  const mediaData = fs.readFileSync(pathToFile)
  const mediaSize = fs.statSync(pathToFile).size

  var mySegIdx = 0;


  var bufferLength = 1000000;
  var theBuffer = Buffer.alloc(bufferLength);
  var offset = 0;
  var segment_index = 0;
  var finished = 0;

  fs.stat(filePath, function(err, stats) {
      var formData, normalAppendCallback, options;

      formData = {
          command: "INIT",
          media_type: 'video/mp4',
          media_category: 'AMPLIFY_VIDEO',
          total_bytes: stats.size
      };
      options = {
          url: 'https://upload.twitter.com/1.1/media/upload.json',
          oauth: oauthCredentials,
          formData: formData
      };

      normalAppendCallback = function(media_id) {
          return function(err, response, body) {

              finished++;
              if (finished === segment_index) {

                  options.formData = {
                      command: 'FINALIZE',
                      media_id: media_id
                  };
                  request.post(options, function(err, response, body) {
                      console.log('FINALIZED',response.statusCode,body);


                      var status = {
                        status: '‏‏‎⠀‎ ⬡  ⬡\n ⬡  ⬡  ⬡   '+hexData.length+' hexes today, enjoy!\n‏‏‎⠀ ⬡  ⬡',
                        //status: '‏‏‎⠀‎ ⬡  ⬡\n ⬡  ⬡  ⬡   test',
                        media_ids: media_id // Pass the media id string
                      }


                      // wait 60 seconds for upload
                      setTimeout(function(){
                        client.post('statuses/update', status, function(error, tweet, response) {
                          if (!error) {
                            console.log(tweet);
                          }else{
                            console.log(error)
                          }
                        });
                      }, 60*1000);

                  });
              }
          };
      };


      request.post(options, function(err, response, body) {
          var media_id;
          media_id = JSON.parse(body).media_id_string;

          fs.open(filePath, 'r', function(err, fd) {
              var bytesRead, data;

              while (offset < stats.size) {

                  bytesRead = fs.readSync(fd, theBuffer, 0, bufferLength, null);
                  data = bytesRead < bufferLength ? theBuffer.slice(0, bytesRead) : theBuffer;
                  options.formData = {
                      command: "APPEND",
                      media_id: media_id,
                      segment_index: segment_index,
                      media_data: data.toString('base64')
                  };
                  request.post(options, normalAppendCallback(media_id));
                  offset += bufferLength;
                  segment_index++
              }
          });
      });
  });




} // end of post tweet





//*
foundWinner = false;
while (!foundWinner){


  console.log(" Trying new set of parameters....")
  try {
    params = generateParams();
    outcome = doParamsConverge(params);
    foundWinner = outcome.isConverged;

    console.log(params);
    console.log(outcome);
  } catch(error){
    console.log(error)
  }
  console.log(" ")




  if(foundWinner){
     console.log("Those parameters were good! Time to make a video & tweet it")
     generateFrames(params, outcome);
     generateVideo();
     // not that postTweet gets called from INSIDE generateVideo()
     // this is because we need to be sure it runs after the video is complete
  }
}
//*/

//generateVideo();
//postTweet();
//generateParams()
