<template>
  <div class="home">
    <Groups/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Groups from '@/components/Groups.vue'; // @ is an alias to /src
import { Mutate } from '@/store';
import { ILight } from 'node-hue-api';

@Component({
  components: {
    Groups,
  },
})
export default class GroupsView extends Vue {
  public async mounted() {
    await this.$store.dispatch(Mutate.refreshGroups);
  }
}
</script>
