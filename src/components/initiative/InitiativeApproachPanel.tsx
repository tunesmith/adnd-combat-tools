import styles from './initiativeApproachPanel.module.css';

const INITIATIVE_APPROACH_SECTIONS = [
  {
    title: 'Motivation',
    paragraphs: [
      'AD&D has a lot of initiative rules we love to argue about. This tool is ' +
        'an attempt to use them ' +
        'consistently to come up with combat orderings that can be viewed in a ' +
        'graphical interface. The graphical interface is also intended to help ' +
        'explain when and why each rule is applied.',
    ],
  },
  {
    title: 'Rules Stance',
    paragraphs: [
      'This tool attempts to be "BtB" or "RAW", where that is defined as referring ' +
        'to the PHB and the DMG. It does not currently attempt to integrate the ' +
        'OSRIC style or other information from Chainmail, Eldritch Wizardry, or ' +
        'Swords and Spells. It also does not (yet) support Unearthed Arcana. ' +
        'Otherwise, I believe the interpretation is defensibly ' +
        'BtB, accepting that there may be many other approaches that are just as defensible.',
      'Guiding principles are that Simple Initiative, where the actions of those ' +
        'with the higher die value commence and complete first, should always be a ' +
        'fallback when the more advanced rules are not determinative. Secondly, it ' +
        'should always be more difficult to complete a timed-duration action than ' +
        'an instant action.',
      'Rules are taken to apply according to their location in the A-H sections from the book, and specific ' +
        'rules are taken to override more general rules. For example, "Rule 2" from ' +
        'DMG p65 is interpreted to apply to attacks against casters that win initiative, ' +
        'while the OWFD section on p66-67 overrides it only in the cases of WSF melee ' +
        'weapons against those initiative-winning casters.',
      'Similarly, segments are only specified where the books mention segments. ' +
        'Actions are otherwise depicted in dependency order, at some indeterminate point in the round.',
    ],
  },
  {
    title: 'Table Judgment',
    paragraphs: [
      'This tool does not attempt to define a fully linear order of all combat ' +
        "actions in the round, because the books don't either. Instead, at any given " +
        'moment, multiple actions are resolvable (look for the little triangle), ' +
        'allowing the DM to choose to resolve them in the order they wish.',
      'For instance, the question of how to schedule Firing Rate (FR) is a popular topic. ' +
        'Here, we depict a missile attack as one node encompassing both arrows or all ' +
        'three darts at once. Feel free to expand or overrule as desired.',
      'Future versions of this tool may support limited preferences for alternate ' +
        'interpretations of rules, depending on feedback.',
    ],
  },
] as const;

export default function InitiativeApproachPanel(): JSX.Element {
  return (
    <section className={styles['approachPanel']}>
      <div className={styles['approachHeader']}>
        <h2 className={styles['approachTitle']}>Approach</h2>
      </div>
      <div className={styles['approachSections']}>
        {INITIATIVE_APPROACH_SECTIONS.map((section) => (
          <section key={section.title} className={styles['approachSection']}>
            <h3 className={styles['approachSectionTitle']}>{section.title}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles['approachParagraph']}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
