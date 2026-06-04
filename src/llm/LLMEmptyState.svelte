<script lang="ts">
  import { t } from '@i18n/messages'
</script>

<div class="empty-state">
  <i class="fa-solid fa-comment-dots"></i>
  <p>{t('llm.emptyPrompt')}</p>
  <div class="privacy-note">
    <i class="fa-solid fa-shield-halved"></i>
    <span>
      <a
        href={t('llm.providerUrl')}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('llm.providerName')}
      </a>
      • {t('llm.sovereignAi')}
    </span>
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: $color-4;

    i {
      font-size: 3rem;
      opacity: 0.5;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
    }

    .privacy-note {
      font-size: 0.75rem;
      color: $color-4;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin-top: 0.5rem;

      i {
        font-size: 0.85rem;
      }

      a {
        color: $color-4;
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: all 0.2s;

        &:hover {
          color: $color-3;
          border-bottom-color: $color-3;
        }
      }
    }
  }
</style>
