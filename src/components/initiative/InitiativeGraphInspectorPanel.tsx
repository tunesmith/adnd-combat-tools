import { forwardRef } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type {
  InitiativeGraphInspectorModel,
  InitiativeGraphNodeReference,
} from '../../helpers/initiative/graphInspector';
import styles from './initiativeGraphInspectorPanel.module.css';

interface InitiativeGraphInspectorPanelProps {
  className?: string;
  model: InitiativeGraphInspectorModel;
  onClearStatus?: (nodeId: string) => void;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onMarkLost?: (nodeId: string) => void;
  onOpenNode?: (nodeId: string) => void;
  onResolve?: (nodeId: string) => void;
  style?: CSSProperties;
}

const renderNodeReference = (reference: InitiativeGraphNodeReference) => (
  <span className={styles['graphNodeReference']}>
    <span className={styles['graphNodeReferenceName']}>
      {reference.combatantName}
    </span>
    <span className={styles['graphNodeReferenceAction']}>
      {reference.actionTitle}
    </span>
    {reference.actionMeta ? (
      <span className={styles['graphNodeReferenceMeta']}>
        {reference.actionMeta}
      </span>
    ) : null}
  </span>
);

export const InitiativeGraphInspectorPanel = forwardRef<
  HTMLDivElement,
  InitiativeGraphInspectorPanelProps
>(
  (
    {
      className,
      model,
      onClearStatus,
      onClick,
      onMarkLost,
      onOpenNode,
      onResolve,
      style,
    },
    ref
  ) => {
    const canShowActions = Boolean(onResolve || onMarkLost || onClearStatus);

    return (
      <div
        ref={ref}
        className={[styles['graphInspector'], className || '']
          .filter(Boolean)
          .join(' ')}
        style={style}
        onClick={onClick}
      >
        <div className={styles['graphInspectorHeader']}>
          <div className={styles['graphInspectorTitle']}>
            {renderNodeReference(model.reference)}
          </div>
        </div>
        <div className={styles['graphInspectorMeta']}>
          <span>Side: {model.sideLabel}</span>
          {model.timingLabel ? <span>{model.timingLabel}</span> : null}
          <span>Status: {model.statusLabel}</span>
        </div>
        {canShowActions ? (
          <div className={styles['graphInspectorActions']}>
            {onResolve ? (
              <button
                type={'button'}
                className={[
                  styles['graphInspectorButton'],
                  styles['graphInspectorButtonResolve'],
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onResolve(model.nodeId)}
                disabled={model.nodeStatus === 'resolved'}
              >
                Resolve
              </button>
            ) : null}
            {onMarkLost ? (
              <button
                type={'button'}
                className={[
                  styles['graphInspectorButton'],
                  styles['graphInspectorButtonLost'],
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onMarkLost(model.nodeId)}
                disabled={model.nodeStatus === 'lost'}
              >
                {model.lostActionLabel}
              </button>
            ) : null}
            {model.nodeStatus && onClearStatus ? (
              <button
                type={'button'}
                className={[
                  styles['graphInspectorButton'],
                  styles['graphInspectorButtonClear'],
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onClearStatus(model.nodeId)}
              >
                Clear status
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={styles['graphInspectorSection']}>
          <h4 className={styles['graphSubhead']}>Why Here</h4>
          <ol className={styles['graphInspectorPlainList']}>
            {model.whyHere.map((line, index) => (
              <li
                key={`why-here-${model.nodeId}-${index}`}
                className={styles['graphInspectorPlainItem']}
              >
                <span className={styles['stepDetail']}>{line}</span>
              </li>
            ))}
          </ol>
        </div>

        {model.incoming.length > 0 ? (
          <div className={styles['graphInspectorSection']}>
            <h4 className={styles['graphSubhead']}>Blocked By</h4>
            <ol className={styles['graphInspectorList']}>
              {model.incoming.map((incoming) => (
                <li
                  key={`incoming-${incoming.nodeId}-${model.nodeId}`}
                  className={styles['graphInspectorItem']}
                >
                  {onOpenNode ? (
                    <button
                      type={'button'}
                      className={styles['graphInspectorLinkButton']}
                      onClick={() => onOpenNode(incoming.nodeId)}
                    >
                      {renderNodeReference(incoming.reference)}
                    </button>
                  ) : (
                    renderNodeReference(incoming.reference)
                  )}
                  <span className={styles['stepDetail']}>
                    {incoming.explanation}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {model.outgoing.length > 0 ? (
          <div className={styles['graphInspectorSection']}>
            <h4 className={styles['graphSubhead']}>Blocks</h4>
            <ul className={styles['graphInspectorLinkList']}>
              {model.outgoing.map((target) => (
                <li key={`outgoing-target-${target.nodeId}`}>
                  {onOpenNode ? (
                    <button
                      type={'button'}
                      className={styles['graphInspectorLinkButton']}
                      onClick={() => onOpenNode(target.nodeId)}
                    >
                      {renderNodeReference(target.reference)}
                    </button>
                  ) : (
                    renderNodeReference(target.reference)
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }
);

InitiativeGraphInspectorPanel.displayName = 'InitiativeGraphInspectorPanel';
