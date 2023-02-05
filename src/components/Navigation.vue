<template>
  <b-navbar type="dark" variant="dark">
    <b-navbar-brand>れじぇくろDB</b-navbar-brand>
    <b-navbar-nav>
      <b-nav-item to="main">メインキャラ</b-nav-item>
      <b-nav-item to="support">サポートキャラ</b-nav-item>
      <b-nav-item to="equipment">装備</b-nav-item>
      <b-nav-item to="about">説明</b-nav-item>
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
export default {
  name: 'Navigation',
  props: {
  }
};
</script>

<style>
.navbar {
  padding: 0.25rem 1rem;
}

.navbar-brand {
  font-size: 1.75em;
  margin-left: 1.0rem;
}

.nav-link {
  font-size: 1.25em;
  color: rgba(255, 255, 255, 0.8) !important;
}
.nav-link:hover, .nav-link:focus {
  color: rgba(255, 255, 255, 0.5) !important;
}
</style>
