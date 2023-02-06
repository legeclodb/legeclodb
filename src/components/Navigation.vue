<template>
  <b-navbar type="dark" variant="dark">
    <b-navbar-brand to="/">れじぇくろDB</b-navbar-brand>
    <b-navbar-nav>
      <b-nav-item to="/main">メインキャラ</b-nav-item>
      <b-nav-item to="/support">サポートキャラ</b-nav-item>
      <b-nav-item to="/item">アイテム</b-nav-item>
      <b-nav-item to="/about">説明</b-nav-item>
    </b-navbar-nav>
    <b-navbar-nav class="ml-auto">
      <b-nav-item href="https://github.com/legeclodb/legeclodb">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" focusable="false" role="img" class="navbar-nav-svg">
          <title>GitHub</title>
          <g fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16,0.4c-8.8,0-16,7.2-16,16c0,7.1,4.6,13.1,10.9,15.2 c0.8,0.1,1.1-0.3,1.1-0.8c0-0.4,0-1.4,0-2.7c-4.5,1-5.4-2.1-5.4-2.1c-0.7-1.8-1.8-2.3-1.8-2.3c-1.5-1,0.1-1,0.1-1 c1.6,0.1,2.5,1.6,2.5,1.6c1.4,2.4,3.7,1.7,4.7,1.3c0.1-1,0.6-1.7,1-2.1c-3.6-0.4-7.3-1.8-7.3-7.9c0-1.7,0.6-3.2,1.6-4.3 c-0.2-0.4-0.7-2,0.2-4.2c0,0,1.3-0.4,4.4,1.6c1.3-0.4,2.6-0.5,4-0.5c1.4,0,2.7,0.2,4,0.5C23.1,6.6,24.4,7,24.4,7 c0.9,2.2,0.3,3.8,0.2,4.2c1,1.1,1.6,2.5,1.6,4.3c0,6.1-3.7,7.5-7.3,7.9c0.6,0.5,1.1,1.5,1.1,3c0,2.1,0,3.9,0,4.4 c0,0.4,0.3,0.9,1.1,0.8C27.4,29.5,32,23.5,32,16.4C32,7.6,24.8,0.4,16,0.4z"></path>
          </g>
        </svg>
      </b-nav-item>
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
  white-space: nowrap;
}
.nav-link:hover, .nav-link:focus {
  color: rgba(255, 255, 255, 0.5) !important;
}
</style>
