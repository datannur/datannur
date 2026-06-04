<script lang="ts">
  import { t } from '@i18n/messages'
</script>

<h2 class="popup-title">{t('search.options.title')}</h2>
<table>
  <tbody>
    <tr>
      <td>...</td>
      <td>{t('search.options.contains')}</td>
    </tr>
    <tr>
      <td>&gt; ...</td>
      <td>{t('search.options.greaterThan')}</td>
    </tr>
    <tr>
      <td>&lt; ...</td>
      <td>{t('search.options.lessThan')}</td>
    </tr>
    <tr>
      <td>= ...</td>
      <td>{t('search.options.exactlyContains')}</td>
    </tr>
    <tr>
      <td>! ...</td>
      <td>{t('search.options.doesNotContain')}</td>
    </tr>
    <tr>
      <td>=""</td>
      <td>{t('search.options.containsNothing')}</td>
    </tr>
    <tr>
      <td>!""</td>
      <td>{t('search.options.containsSomething')}</td>
    </tr>
  </tbody>
</table>

<style lang="scss">
  @use 'main.scss' as *;

  table {
    width: 100%;
    border-collapse: collapse;
    & td {
      padding: 5px 10px;
      text-align: left;
    }
  }

  .popup-title {
    font-weight: bold;
    font-size: 18px;
  }
</style>
