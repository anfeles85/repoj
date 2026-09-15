<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container-fluid d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
      <div>
        <span>Copyright &copy; {{ currentYear }} <strong>REPOJ</strong>. Todos los derechos reservados.</span>
      </div>
      <div class="small">
        <span class="text-muted">Sistema de Análisis de Juicios Evaluativos | v1.0.0</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Los estilos generales residen en main.css */
</style>
