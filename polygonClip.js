// https://observablehq.com/@d3/polygonclip#polygonClip
module.exports = {
  polygonClip
};


function polygonClip(clip, subject) {
  const closed = polygonClosed(subject);
  const n = clip.length - polygonClosed(clip);
  subject = subject.slice(); // copy before mutate
  for (let i = 0, a = clip[n - 1], b, c, d; i < n; ++i) {
    const input = subject.slice();
    const m = input.length - closed;
    subject.length = 0;
    b = clip[i];
    c = input[m - 1];
    for (let j = 0; j < m; ++j) {
      d = input[j];
      if (lineOrient(d, a, b)) {
        if (!lineOrient(c, a, b)) {
          subject.push(lineIntersect(c, d, a, b));
        }
        subject.push(d);
      } else if (lineOrient(c, a, b)) {
        subject.push(lineIntersect(c, d, a, b));
      }
      c = d;
    }
    if (closed) subject.push(subject[0]);
    a = b;
  }
  return subject.length ? subject : null;
}



function lineOrient([px, py], [ax, ay], [bx, by]) {
  return (bx - ax) * (py - ay) < (by - ay) * (px - ax);
}



function lineIntersect([ax, ay], [bx, by], [cx, cy], [dx, dy]) {
  const bax = bx - ax, bay = by - ay, dcx = dx - cx, dcy = dy - cy;
  const k = (bax * (cy - ay) - bay * (cx - ax)) / (bay * dcx - bax * dcy);
  return [cx + k * dcx, cy + k * dcy];
}



function polygonClosed(points) {
  const [ax, ay] = points[0], [bx, by] = points[points.length - 1];
  return ax === bx && ay === by;
}



function polygonConvex(points) {
  const n = points.length;
  const [rx, ry] = points[n - 2];
  let [qx, qy] = points[n - 1];
  let vx = rx - qx, vy = ry - qy;
  for (let i = 0; i < n; ++i) {
    const [px, py] = points[i];
    const wx = qx - px, wy = qy - py;
    if (wx * vy < wy * vx) return false;
    if (wx || wy) vx = wx, vy = wy;
    qx = px, qy = py;
  }
  return true;
}
