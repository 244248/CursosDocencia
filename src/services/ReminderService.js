import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'TU_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'TU_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'TU_TEMPLATE_ID';

const DIAS_ANTES_RECORDATORIO = 3;

function diasHasta(fechaCurso) {
  if (!fechaCurso) return Infinity;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaCurso);
  fecha.setHours(0, 0, 0, 0);
  const diff = fecha.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function cursoCercano(fechaCurso) {
  const dias = diasHasta(fechaCurso);
  return dias >= 0 && dias <= DIAS_ANTES_RECORDATORIO;
}

function yaEnviado(cursoKey, teacherKey) {
  const key = `reminder_${cursoKey}_${teacherKey}_${new Date().toISOString().split('T')[0]}`;
  return localStorage.getItem(key) === 'sent';
}

function marcarEnviado(cursoKey, teacherKey) {
  const key = `reminder_${cursoKey}_${teacherKey}_${new Date().toISOString().split('T')[0]}`;
  localStorage.setItem(key, 'sent');
}

async function enviarRecordatorio(teacher, curso) {
  try {
    const dias = diasHasta(curso.fecha);
    const templateParams = {
      to_name: teacher.nombre,
      to_email: teacher.email,
      curso_nombre: curso.nombre,
      curso_fecha: new Date(curso.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      dias_restantes: dias,
      mensaje: dias === 0 
        ? '¡HOY es la fecha límite del curso!' 
        : `Tienes ${dias} día${dias > 1 ? 's' : ''} para completar el curso.`,
      reply_to: 'no-reply@gestioncursodocente.com'
    };

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    return { success: true, email: teacher.email };
  } catch (error) {
    console.error(`Error enviando recordatorio a ${teacher.email}:`, error);
    return { success: false, email: teacher.email, error: error.message };
  }
}

async function enviarRecordatorios(courses, teachers) {
  const resultados = { enviados: 0, errores: 0, detalles: [] };
  const cursosCercanos = Object.entries(courses).filter(([_, curso]) => curso.fecha && cursoCercano(curso.fecha));

  if (cursosCercanos.length === 0) {
    return { ...resultados, mensaje: 'No hay cursos con fecha próxima' };
  }

  for (const [cursoKey, curso] of cursosCercanos) {
    if (!curso.assignedTeachers || curso.assignedTeachers.length === 0) continue;

    for (const teacherKey of curso.assignedTeachers) {
      if (yaEnviado(cursoKey, teacherKey)) continue;

      const teacher = teachers.find(t => t.key === teacherKey);
      if (!teacher || !teacher.email) continue;

      const resultado = await enviarRecordatorio(teacher, curso);
      if (resultado.success) {
        marcarEnviado(cursoKey, teacherKey);
        resultados.enviados++;
        resultados.detalles.push({ email: teacher.email, curso: curso.nombre, status: 'enviado' });
      } else {
        resultados.errores++;
        resultados.detalles.push({ email: teacher.email, curso: curso.nombre, status: 'error', error: resultado.error });
      }
    }
  }

  return resultados;
}

export default { enviarRecordatorios, cursoCercano, diasHasta };
