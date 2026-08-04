import { publicationSchema } from './schemas';
import type { Image, Publication } from './types';
import { estimateReadingMinutes } from '../utilities/content';

const generatedAt = '2026-07-30T16:00:00.000Z';

function image(
  id: string,
  file: string,
  width: number,
  height: number,
  alt: string,
  caption: string,
  credit: string,
  rightsNote: string,
): Image {
  return {
    id,
    alt,
    caption,
    credit,
    rightsNote,
    focalPoint: 'center',
    width,
    height,
    sources: [{ src: `/edition/${file}`, width, height, type: 'image/jpeg' }],
  };
}

const ferryImage = image(
  'image-ferry',
  'ferry-harbor.jpg',
  1920,
  1442,
  'A passenger ferry crossing blue water near a wooded shoreline',
  'Illustrative photograph of a ferry crossing between Anacortes and Friday Harbor, Washington. It does not depict the fictional events in this story.',
  'Buidhe / Wikimedia Commons',
  'CC BY-SA 4.0. Source: https://commons.wikimedia.org/wiki/File:Anacortes_to_Friday_Harbor_ferry_ride.jpg',
);

const councilImage = image(
  'image-council',
  'council-chamber.jpg',
  1920,
  1285,
  'Residents seated in a municipal council chamber during a public meeting',
  'Illustrative photograph of a 2010 council meeting in Biloxi, Mississippi. It does not depict the fictional Meridian County council.',
  'Tim Burkitt / FEMA',
  'Public domain. Source: https://commons.wikimedia.org/wiki/File:FEMA_-_45136_-_Biloxi_City_council_meets_in_renovated_City_Hall.jpg',
);

const towerImage = image(
  'image-tower',
  'communications-tower.jpg',
  1920,
  2560,
  'A steel communications tower rising into a clear sky',
  'Illustrative photograph of a communications tower. It does not depict the fictional North Sound radio network.',
  'Jonathon Coombes / Wikimedia Commons',
  'Public domain. Source: https://commons.wikimedia.org/wiki/File:Communications_tower.jpg',
);

const marketImage = image(
  'image-market',
  'farmers-market.jpg',
  1920,
  1280,
  'Crates of tomatoes, peppers, squash, and other produce at an outdoor market',
  'Illustrative photograph of produce at a farmers market. It does not depict the fictional Meridian Market Cooperative.',
  'Julian Hanslmaier / Wikimedia Commons',
  'CC0 1.0. Source: https://commons.wikimedia.org/wiki/File:Farmer%27s_Market_Produce_(Unsplash).jpg',
);

const libraryImage = image(
  'image-library',
  'library-interior.jpg',
  1920,
  1281,
  'A bright public library interior with bookshelves, stairs, and reading areas',
  'Illustrative photograph of Christchurch Public Library. It does not depict the fictional Northfield Library.',
  'Susan Gerbic / Wikimedia Commons',
  'CC BY-SA 4.0. Source: https://commons.wikimedia.org/wiki/File:Christchurch_Public_Library_interior_001.jpg',
);

const theaterImage = image(
  'image-theater',
  'theater-marquee.jpg',
  1576,
  1180,
  'A vintage movie theater marquee above a downtown sidewalk',
  'Illustrative photograph of a theater marquee in Port Orchard, Washington. It does not depict the fictional Rialto Theater.',
  'Arthur Allen / Wikimedia Commons',
  'CC0 1.0. Source: https://commons.wikimedia.org/wiki/File:Port_Orchard_movie_theater_marquee._(50530887668).jpg',
);

function paragraph(text: string) {
  return {
    nodeType: 'paragraph',
    data: {},
    content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
  };
}

function heading(text: string) {
  return {
    nodeType: 'heading-2',
    data: {},
    content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
  };
}

function quote(text: string) {
  return {
    nodeType: 'blockquote',
    data: {},
    content: [paragraph(text)],
  };
}

function body(
  introduction: string[],
  sections: Array<{ title: string; paragraphs: string[]; quote?: string }>,
) {
  return {
    nodeType: 'document' as const,
    data: {},
    content: [
      ...introduction.map(paragraph),
      ...sections.flatMap((section) => [
        heading(section.title),
        ...section.paragraphs.map(paragraph),
        ...(section.quote ? [quote(section.quote)] : []),
      ]),
    ],
  };
}

const articleDrafts = [
  {
    id: 'article-harbor',
    title: 'Late ferry plan offers a lifeline while the Bay Bridge repair slips again',
    slug: 'late-ferry-plan-bay-bridge-repair',
    dek: 'Meridian County will add four evening sailings for six weeks as contractors replace corroded joints on the region’s busiest bridge.',
    storyLabel: 'Standard story' as const,
    body: body(
      [
        'MERIDIAN HARBOR - The last passenger ferry will leave East Bay at 11:40 p.m. beginning Friday, a temporary expansion county officials say is meant to keep restaurant workers, hospital staff, and students moving while repairs close two lanes of the Bay Bridge.',
        'The six-week schedule adds four sailings each night and restores a direct stop at Pine Harbor. Fares will remain unchanged. Bicycles will travel free after 7 p.m., and the county says every late boat will connect with the Route 8 bus at Longview Terminal.',
      ],
      [
        {
          title: 'A repair that keeps growing',
          paragraphs: [
            'Bridge inspectors found deeper corrosion than expected after crews removed the first expansion joint in June. The discovery pushed the projected reopening from August 9 to September 18 and raised the estimated repair cost from $8.2 million to $11.6 million.',
            'Transportation director Lena Ortiz said the county chose added ferry service over a second temporary bus lane because buses would still sit in the same bridge traffic. The ferry contract can be extended in two-week increments if construction falls further behind.',
          ],
          quote:
            'The late boat does not solve every trip, but it gives people a predictable way home when the bridge cannot.',
        },
        {
          title: 'What riders need to know',
          paragraphs: [
            'The first added departure leaves Meridian Harbor at 8:20 p.m. The final round trip departs East Bay at 11:40 p.m. and arrives back at the downtown terminal shortly after midnight. The county will post real-time capacity notices at the terminal and on its transit alert page.',
            'Officials expect the added service to carry between 450 and 600 riders each night. The first week will be treated as a trial, with departure times adjusted if transfers routinely miss the boats.',
          ],
        },
      ],
    ),
    heroImage: ferryImage,
    authorIds: ['author-elise', 'author-daniel'],
    primaryCategoryId: 'category-americas',
    topicIds: ['topic-world-events', 'topic-geopolitics'],
    sourceIds: ['source-fema', 'source-transit'],
    relatedArticleIds: ['article-transit', 'article-flood-analysis', 'article-ferry-opinion'],
    publicationDate: '2026-07-30T14:30:00.000Z',
    featured: true,
  },
  {
    id: 'article-budget',
    title: 'A one-vote capital plan moves the new transit compact closer to reality',
    slug: 'one-vote-capital-plan-transit-compact',
    dek: 'The committee vote exposed a sharp divide over whether Meridian County should borrow now or postpone two station projects.',
    storyLabel: 'Analysis' as const,
    body: body(
      [
        'The 5-4 vote that advanced Meridian County’s five-year capital plan was narrow, but the argument behind it was broader than a single bond issue. Council members were deciding how much uncertainty the county can tolerate while construction prices, ridership, and federal grants move in different directions.',
        'The approved draft reserves $74 million for two rail stations, a bus maintenance garage, and the first phase of a unified fare system. It also assumes the county will issue debt before interest costs fall, a choice that drew the sharpest criticism.',
      ],
      [
        {
          title: 'Why the timing matters',
          paragraphs: [
            'Supporters say waiting carries its own price. The planning office estimates that delaying the Northfield station by two years would add at least $9 million through labor escalation and redesign. Opponents say that estimate is less certain than the debt payments the county would lock in immediately.',
            'The dispute is not simply about spending more or spending less. It is about which risk belongs on the public balance sheet: higher borrowing costs today, or higher construction costs later.',
          ],
        },
        {
          title: 'The vote that comes next',
          paragraphs: [
            'The full council can still amend the package in August. Two members who supported the committee draft said they want a firm cap on station costs before the final vote. That makes the current majority fragile and gives transit staff three weeks to narrow the estimates.',
            'If the plan passes, design work could begin in October. Construction would not start before late 2027, leaving future councils to decide whether the compact survives its first encounter with a tighter budget.',
          ],
        },
      ],
    ),
    heroImage: councilImage,
    authorIds: ['author-marcus'],
    primaryCategoryId: 'category-analysis',
    topicIds: ['topic-analysis', 'topic-world-events'],
    sourceIds: ['source-transit'],
    relatedArticleIds: ['article-transit', 'article-harbor'],
    publicationDate: '2026-07-30T11:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-network',
    title: 'Inside the volunteer radio network preparing for the next regional blackout',
    slug: 'volunteer-radio-network-regional-blackout',
    dek: 'Forty-three operators spent a rain-soaked Saturday testing whether neighborhood messages could travel when phones and internet service cannot.',
    storyLabel: 'Standard story' as const,
    body: body(
      [
        'At 6:02 a.m., before the first buses began running, a clipped voice came through a battery-powered radio in the basement of Northfield Fire Station 3. The message had traveled from a school gym, across two hilltop repeaters, to a folding table covered with paper maps and handwritten call signs.',
        'The exercise was intentionally low-tech. Volunteers switched off cellular data, covered the station clocks, and passed every request by voice. Their job was to move information about blocked roads, medicine, shelter beds, and water pumps without relying on the systems most people use every day.',
      ],
      [
        {
          title: 'A network made of people',
          paragraphs: [
            'North Sound Emergency Radio began after the 2024 windstorm, when several neighborhoods lost power and mobile service for nearly a day. The network now includes 43 licensed operators, eight portable repeaters, and agreements with six libraries and schools.',
            'Coordinator Tessa Ward said the equipment matters less than the routines. Every message is repeated back, logged on paper, and assigned a number so two stations cannot unknowingly act on different versions of the same request.',
          ],
          quote:
            'A radio is only useful when the person holding it knows who is listening and what happens next.',
        },
        {
          title: 'Where the signal still fails',
          paragraphs: [
            'The drill exposed weak coverage along the west bluff and a three-minute bottleneck when the central station received several medical messages at once. Organizers plan to move one repeater and train a second dispatcher before the winter exercise.',
            'County emergency staff observed but did not direct the network. That separation is deliberate: volunteers want a system that can support public agencies without becoming dependent on the same buildings, power, and staffing.',
          ],
        },
        {
          title: 'The quiet end of the test',
          paragraphs: [
            'Just after 6 p.m., Ward read the final simulated all-clear. The room did not cheer. Operators checked their logs, coiled cables, and compared missed messages. The useful measure of the day was not how many voices reached the station, she said, but how few were lost between one person and the next.',
          ],
        },
      ],
    ),
    heroImage: towerImage,
    authorIds: ['author-sophia'],
    primaryCategoryId: 'category-americas',
    topicIds: ['topic-world-events'],
    sourceIds: ['source-cisa'],
    relatedArticleIds: ['article-broadband-brief', 'article-flood-analysis'],
    publicationDate: '2026-07-29T16:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-ferry-opinion',
    title: 'Opinion: The ferry timetable is climate policy, too',
    slug: 'opinion-ferry-timetable-climate-policy',
    dek: 'A public transit system cannot ask residents to drive less while leaving shift workers without a reliable trip home.',
    storyLabel: 'Opinion' as const,
    body: body(
      [
        'The county’s new late ferry schedule is described as a temporary response to bridge repairs. It should also be treated as a test of something more important: whether public transit can serve people whose days do not end at 6 p.m.',
        'For years, the regional climate plan has encouraged residents to make fewer car trips. That goal is reasonable. But it becomes hollow when a kitchen worker, nursing assistant, or community college student can take transit to work and still need a car to get home.',
      ],
      [
        {
          title: 'Reliability changes behavior',
          paragraphs: [
            'People do not build routines around a service they expect to lose. One late sailing can matter more than several midday departures because it removes the risk of being stranded. The same logic applies to early buses and weekend connections.',
            'The county should measure the trial by more than total riders. It should ask who used the boats, which shifts they were traveling to, and how often a timed bus connection succeeded.',
          ],
        },
        {
          title: 'Keep what works',
          paragraphs: [
            'When the bridge reopens, officials will face pressure to restore the old timetable. They should resist making that decision automatically. If the late sailings are carrying people who previously drove, the climate benefit will be real even if the boats are not full.',
            'A timetable is a statement about whose time matters. For six weeks, Meridian County is extending that promise past sunset. It should be prepared to keep it.',
          ],
        },
      ],
    ),
    heroImage: ferryImage,
    authorIds: ['author-iman'],
    primaryCategoryId: 'category-guest-articles',
    topicIds: ['topic-invitational-pieces', 'topic-geopolitics'],
    sourceIds: ['source-transit'],
    relatedArticleIds: ['article-harbor', 'article-transit'],
    publicationDate: '2026-07-29T09:15:00.000Z',
    featured: true,
  },
  {
    id: 'article-market',
    title: 'Independent grocers open a shared cold-storage hub near the old freight yard',
    slug: 'independent-grocers-shared-cold-storage-hub',
    dek: 'Seven stores and 18 farms are pooling deliveries in an effort to cut spoilage, shorten truck routes, and keep more local produce on neighborhood shelves.',
    storyLabel: 'Standard story' as const,
    body: body(
      [
        'NORTHFIELD - The first pallets rolled into Meridian Market Cooperative before sunrise Monday: tomatoes from East Ridge, greens from Alder Flats, and boxes of peaches bound for seven independent grocery stores across the county.',
        'The 24,000-square-foot cold-storage hub replaces a patchwork of rented coolers and individual farm deliveries. Cooperative members say the shared system will let small stores buy from local producers without requiring each farmer to make several stops.',
      ],
      [
        {
          title: 'One delivery, several storefronts',
          paragraphs: [
            'Orders are combined each evening and sorted by store before dawn. The cooperative estimates that participating farms will drive 1,800 fewer miles each week during the summer season. Stores expect spoilage to fall because produce can remain refrigerated between delivery and display.',
            'The project cost $3.4 million, financed through member contributions, a county loan, and a regional food-business grant. The cooperative has space for three more stores but plans to wait through the fall before expanding.',
          ],
        },
        {
          title: 'A cautious first season',
          paragraphs: [
            'Manager Rosa Bell said the biggest challenge will be matching the speed of a larger distributor while keeping separate records for each farm. A barcode system tracks every case from arrival to pickup, but workers will continue paper checks during the first month.',
            'For shoppers, the change may be subtle: more local labels, fewer empty produce bins, and a longer season for some crops. For the stores, the experiment is about whether sharing infrastructure can preserve their independence.',
          ],
        },
      ],
    ),
    heroImage: marketImage,
    authorIds: ['author-lauren'],
    primaryCategoryId: 'category-americas',
    topicIds: ['topic-world-events'],
    sourceIds: ['source-usda'],
    relatedArticleIds: ['article-rialto', 'article-library-brief'],
    publicationDate: '2026-07-28T15:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-rialto',
    title: 'The Rialto’s restored marquee brings light back to Market Street',
    slug: 'rialto-restored-marquee-market-street',
    dek: 'After eighteen months behind scaffolding, the 1938 theater sign is glowing again as the building prepares for a new life as a community arts center.',
    storyLabel: 'Standard story' as const,
    body: body(
      [
        'RIVERTON - At 8:47 p.m. Saturday, the first row of red letters lit above Market Street. A second row followed, then the Rialto name, sending a ripple of applause through the crowd gathered across from the old theater.',
        'The relighting marked the end of an 18-month restoration and the beginning of a larger renovation inside. The nonprofit Riverton Arts Exchange plans to reopen the 420-seat auditorium next spring for films, concerts, lectures, and student performances.',
      ],
      [
        {
          title: 'Old glass, new wiring',
          paragraphs: [
            'Workers cataloged more than 600 pieces of painted glass before rebuilding the frame and replacing damaged wiring. Where original panels could not be saved, a regional glass shop matched the color and surface pattern from fragments found behind the sign.',
            'The new lighting uses low-energy bulbs, but the sequencing follows the theater’s original 1938 drawings. The marquee can still be changed by hand from a narrow service platform above the sidewalk.',
          ],
        },
        {
          title: 'A downtown anchor',
          paragraphs: [
            'Nearby restaurants extended their hours for the ceremony, and the city closed one block of Market Street. Business owners hope regular events will bring evening foot traffic back to a corridor that has lost two department stores in five years.',
            'The arts exchange has raised $7.8 million of its $9.1 million renovation goal. The remaining work includes accessibility upgrades, rehearsal rooms, and a fire-safety system. For one night, though, the unfinished building already looked open.',
          ],
        },
      ],
    ),
    heroImage: theaterImage,
    authorIds: ['author-ava'],
    primaryCategoryId: 'category-culture-history',
    topicIds: ['topic-world-history'],
    sourceIds: ['source-nea'],
    relatedArticleIds: ['article-market', 'article-book'],
    publicationDate: '2026-07-28T10:30:00.000Z',
    featured: true,
  },
  {
    id: 'article-transit',
    title: 'Three towns approve a single fare system for buses, ferries, and rail',
    slug: 'three-towns-single-regional-fare-system',
    dek: 'The North Sound transit compact clears its final local vote, setting up a two-year transition to one card and one set of transfer rules.',
    storyLabel: 'Standard story' as const,
    body: body(
      [
        'The Riverton Council voted 6-1 Tuesday to join Northfield and Meridian Harbor in a unified fare system, ending eight months of negotiations over revenue, discounts, and who will answer rider complaints.',
        'The compact creates one payment card for local buses, county ferries, and the North Sound rail line. Riders will receive free transfers for 90 minutes, and existing senior, student, and reduced-fare programs will carry across all three systems.',
      ],
      [
        {
          title: 'A two-year transition',
          paragraphs: [
            'Transit agencies will spend the next year replacing payment equipment and testing a shared account system. Mobile payments are scheduled to begin in early 2027, followed by physical cards and cash-to-card kiosks later that year.',
            'No fare increases are included in the compact. Any future change will require a public vote by the joint transit board, where each town holds two seats and the county holds three.',
          ],
        },
        {
          title: 'The details riders will notice',
          paragraphs: [
            'The most immediate change will be transfer policy. Today, a rider who leaves a Riverton bus for a county ferry pays twice. Under the compact, the second trip will be free if it begins within 90 minutes.',
            'Officials still need to decide how passes will work for riders without bank accounts or smartphones. The agreement requires cash options at every major station, but the number and location of neighborhood retailers will be set next spring.',
          ],
        },
      ],
    ),
    heroImage: ferryImage,
    authorIds: ['author-daniel'],
    primaryCategoryId: 'category-americas',
    topicIds: ['topic-world-events', 'topic-geopolitics'],
    sourceIds: ['source-transit'],
    relatedArticleIds: ['article-budget', 'article-harbor', 'article-ferry-opinion'],
    publicationDate: '2026-07-27T17:20:00.000Z',
    featured: true,
  },
  {
    id: 'article-flood-analysis',
    title: 'Why the new flood map changes more than insurance premiums',
    slug: 'new-flood-map-changes-shoreline-planning',
    dek: 'Revised risk lines will shape mortgages, building permits, road projects, and the political argument over who pays for a safer shoreline.',
    storyLabel: 'Analysis' as const,
    body: body(
      [
        'The first thing most homeowners notice on a flood map is whether a line crosses their property. But the new Meridian County draft reaches much further. It will influence what can be built, which roads are reinforced first, and how lenders calculate risk for decades.',
        'The map places 1,240 additional structures inside the projected one-percent annual flood zone. County engineers say most of the change comes from better elevation data and updated storm-surge modeling, not from a sudden change in the shoreline.',
      ],
      [
        {
          title: 'A map is not a forecast',
          paragraphs: [
            'The one-percent zone does not mean a flood will happen once every hundred years. It describes probability in any single year, which compounds over the life of a mortgage. A home can avoid flooding for decades and still carry meaningful long-term risk.',
            'That distinction matters because residents often interpret a newly drawn line as a prediction about the next storm. Officials will need to explain uncertainty without making the map sound optional.',
          ],
        },
        {
          title: 'The public choices behind the lines',
          paragraphs: [
            'Insurance requirements are only one consequence. The county capital plan gives extra weight to roads and utilities inside higher-risk areas. New construction may need elevated electrical systems, flood vents, or additional review.',
            'The political question is how much of that cost belongs to individual property owners and how much should be shared. The map cannot answer it. What it does is make the tradeoffs harder to postpone.',
          ],
        },
      ],
    ),
    heroImage: councilImage,
    authorIds: ['author-marcus', 'author-elise'],
    primaryCategoryId: 'category-analysis',
    topicIds: ['topic-analysis', 'topic-world-events'],
    sourceIds: ['source-fema'],
    relatedArticleIds: ['article-harbor', 'article-network'],
    publicationDate: '2026-07-27T09:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-book',
    title: 'Book review: A city listens for itself in The Sound Between Streets',
    slug: 'book-review-sound-between-streets',
    dek: 'Nora Field’s fictional novel follows one block through a year of departures, renovations, and the ordinary sounds that survive both.',
    storyLabel: 'Review' as const,
    body: body(
      [
        'The loudest scene in The Sound Between Streets is barely a scene at all. A delivery truck idles below an apartment window while two neighbors, neither named yet, wait for someone else to complain. The engine eventually stops. The silence that follows becomes the novel’s first shared event.',
        'Nora Field’s fictional book is built from moments like this: brief, public, and easy to overlook. Its characters share an address on Mercy Street, but the novel resists turning the building into a convenient symbol. People arrive, leave, disagree, and sometimes fail to notice one another.',
      ],
      [
        {
          title: 'A neighborhood measured in sound',
          paragraphs: [
            'Field organizes the book by season rather than character. Each section returns to familiar noises: a radiator, basketballs in the schoolyard, the old theater sign clicking off. Repetition gives the street a memory that no single narrator controls.',
            'The device could feel precious. Instead, the prose stays exact. Field is most persuasive when she lets an object carry the emotion of a room, as when a tenant packs every plate except the chipped one a former roommate hated.',
          ],
        },
        {
          title: 'What remains after change',
          paragraphs: [
            'A late renovation plot brings the novel close to familiar arguments about displacement, but the ending refuses a simple victory or loss. Some residents stay. Others cannot. The building survives with fewer traces of the people who made it legible.',
            'The Sound Between Streets asks whether a neighborhood is a place, a set of relationships, or a story told after both have changed. Its answer is quiet and incomplete, which is exactly why it lingers.',
          ],
        },
      ],
    ),
    heroImage: libraryImage,
    authorIds: ['author-mara'],
    primaryCategoryId: 'category-culture-history',
    topicIds: ['topic-book-reviews', 'topic-world-history'],
    bookId: 'book-sound-between-streets',
    sourceIds: [],
    relatedArticleIds: ['article-rialto', 'article-library-brief'],
    publicationDate: '2026-07-26T13:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-broadband-brief',
    title: 'Broadband pilot reaches three hillside neighborhoods',
    slug: 'broadband-pilot-hillside-neighborhoods',
    dek: 'Crews have connected the first 312 addresses in the Northfield municipal broadband test, with free service available through September.',
    storyLabel: 'Brief' as const,
    body: body(
      [
        'Northfield’s municipal broadband pilot connected its first 312 homes and businesses this week in Ridgeview, West Bluff, and Quarry Hill.',
        'Residents in the test area can activate free service through September while the city measures speed, reliability, and customer support demand. The council will review results in October before deciding whether to extend the network.',
      ],
      [
        {
          title: 'How to check an address',
          paragraphs: [
            'Eligible households will receive a letter from the city and can also confirm service through the public works office. Officials said no payment information is required for the trial.',
            'The pilot focuses on streets where the city already owns conduit, reducing the cost of the initial build. A broader expansion would require a separate financing plan and public vote.',
          ],
        },
      ],
    ),
    authorIds: ['author-sophia'],
    primaryCategoryId: 'category-americas',
    topicIds: ['topic-world-events'],
    sourceIds: ['source-fcc'],
    relatedArticleIds: ['article-network'],
    publicationDate: '2026-07-25T18:00:00.000Z',
    featured: false,
  },
  {
    id: 'article-library-brief',
    title: 'Northfield Library adds Sunday hours at two branches',
    slug: 'northfield-library-sunday-hours',
    dek: 'The Central and East Ridge branches will open from noon to 5 p.m. on Sundays beginning this weekend.',
    storyLabel: 'Brief' as const,
    body: body(
      [
        'Northfield Library will add Sunday hours at its Central and East Ridge branches beginning August 2. Both locations will open from noon to 5 p.m.',
        'The six-month pilot restores a schedule cut in 2023. The library board set aside $118,000 for staffing, security, and additional custodial hours.',
      ],
      [
        {
          title: 'Services available',
          paragraphs: [
            'Visitors will be able to borrow materials, use public computers, reserve study rooms, and receive basic research help. Passport appointments and local-history requests will remain limited to weekday hours.',
            'The library will count visits and computer use before deciding whether to make the schedule permanent next spring.',
          ],
        },
      ],
    ),
    heroImage: libraryImage,
    authorIds: ['author-ava'],
    primaryCategoryId: 'category-culture-history',
    topicIds: ['topic-world-history'],
    sourceIds: [],
    relatedArticleIds: ['article-book', 'article-rialto'],
    publicationDate: '2026-07-25T12:00:00.000Z',
    featured: false,
  },
];

export const fixturePublication: Publication = publicationSchema.parse({
  settings: {
    publicationName: 'The Transoceanic Cable',
    shortName: 'Cable',
    tagline: 'Reporting across borders.',
    description:
      'Independent reporting, analysis, guest perspectives, culture, history, and world affairs.',
    textLogo: 'The Transoceanic Cable',
    footerSections: [
      {
        title: 'Read',
        links: [
          { label: 'Latest', url: '/latest/' },
          { label: 'Topics', url: '/topics/' },
          { label: 'Search', url: '/search/' },
        ],
      },
      {
        title: 'Publication',
        links: [
          { label: 'About', url: '/about/' },
          { label: 'Staff', url: '/staff/' },
          { label: 'RSS', url: '/rss.xml' },
        ],
      },
      {
        title: 'Sections',
        links: [
          { label: 'Analysis', url: '/categories/analysis/' },
          { label: 'Guest Articles', url: '/categories/guest-articles/' },
          { label: 'Culture and History', url: '/categories/culture-and-history/' },
        ],
      },
    ],
    contactLinks: [],
    socialLinks: [
      { label: 'Instagram', url: 'https://www.instagram.com/' },
      { label: 'Facebook', url: 'https://www.facebook.com/' },
      { label: 'X', url: 'https://x.com/' },
      { label: 'YouTube', url: 'https://www.youtube.com/' },
    ],
    copyrightText:
      'The Transoceanic Cable. Fictional editorial edition. All bylines, places, institutions, and local events are invented. Photography is illustrative.',
    launched: true,
    defaultSocialImage: ferryImage,
  },
  homepage: {
    curated: false,
    secondaryLeadArticleIds: [],
    featuredAnalysisIds: [],
    featuredOpinionIds: [],
    featuredReviewIds: [],
    announcement: '',
  },
  articles: articleDrafts.map((article) => ({
    ...article,
    previousSlugs: [],
    correctionNote: '',
    readingMinutes: estimateReadingMinutes(JSON.stringify(article.body)),
  })),
  authors: [
    {
      id: 'author-elise',
      name: 'Elise Morton',
      slug: 'elise-morton',
      position: 'Coastal affairs reporter',
      shortBiography:
        'Elise Morton covers ports, climate adaptation, and the communities along the North Sound.',
      fullBiography:
        'Elise Morton covers ports, climate adaptation, and shoreline communities for The Transoceanic Cable. She previously reported on public works and environmental policy. This staff profile is fictional.',
      areasOfCoverage: ['World', 'Climate', 'Infrastructure'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-daniel',
      name: 'Daniel Choi',
      slug: 'daniel-choi',
      position: 'Transportation reporter',
      shortBiography:
        'Daniel Choi reports on buses, ferries, rail, and the public decisions that connect them.',
      fullBiography:
        'Daniel Choi covers transportation and regional planning for The Transoceanic Cable, with an emphasis on how policy changes affect daily travel. This staff profile is fictional.',
      areasOfCoverage: ['Politics', 'Transportation', 'World'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-marcus',
      name: 'Marcus Green',
      slug: 'marcus-green',
      position: 'Government and data editor',
      shortBiography:
        'Marcus Green writes explanatory stories about budgets, elections, and public institutions.',
      fullBiography:
        'Marcus Green is The Transoceanic Cable’s government and data editor. His reporting focuses on public finance, elections, and institutional accountability. This staff profile is fictional.',
      areasOfCoverage: ['Analysis', 'Politics', 'Economics'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-sophia',
      name: 'Sophia Ramirez',
      slug: 'sophia-ramirez',
      position: 'Technology reporter',
      shortBiography:
        'Sophia Ramirez covers communications infrastructure, public technology, and digital access.',
      fullBiography:
        'Sophia Ramirez reports on the systems that keep communities connected, from broadband and radio networks to public records and digital services. This staff profile is fictional.',
      areasOfCoverage: ['Technology', 'Infrastructure', 'Public safety'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-lauren',
      name: 'Lauren Patel',
      slug: 'lauren-patel',
      position: 'Economics reporter',
      shortBiography:
        'Lauren Patel covers small business, labor, food systems, and the regional economy.',
      fullBiography:
        'Lauren Patel reports on work, small business, and the practical systems behind the regional economy. This staff profile is fictional.',
      areasOfCoverage: ['Economics', 'Labor', 'Food'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-ava',
      name: 'Ava Kline',
      slug: 'ava-kline',
      position: 'Arts and culture reporter',
      shortBiography:
        'Ava Kline writes about books, performance, public spaces, and cultural memory.',
      fullBiography:
        'Ava Kline covers arts, culture, libraries, and the public places where communities gather. This staff profile is fictional.',
      areasOfCoverage: ['Culture', 'Books', 'Public life'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-mara',
      name: 'Mara Vale',
      slug: 'mara-vale',
      position: 'Books editor',
      shortBiography:
        'Mara Vale edits and writes reviews, essays, and conversations about books and criticism.',
      fullBiography:
        'Mara Vale is the books editor at The Transoceanic Cable. She commissions criticism and writes about fiction, translation, and the life of libraries. This staff profile is fictional.',
      areasOfCoverage: ['Books', 'Culture'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-iman',
      name: 'Iman Reed',
      slug: 'iman-reed',
      position: 'Guest columnist',
      shortBiography: 'Iman Reed writes about transportation, public space, and civic life.',
      fullBiography:
        'Iman Reed is a fictional guest columnist whose work examines transportation, public space, and civic life.',
      areasOfCoverage: ['Opinion', 'Transportation'],
      socialLinks: [],
      designation: 'Guest',
      status: 'Active',
    },
  ],
  categories: [
    [
      'category-analysis',
      'Analysis',
      'analysis',
      'Evidence, context, and interpretation of world affairs.',
      0,
      'graphite',
    ],
    [
      'category-guest-articles',
      'Guest Articles',
      'guest-articles',
      'Essays and reporting from invited contributors.',
      1,
      'oxblood',
    ],
    [
      'category-culture-history',
      'Culture and History',
      'culture-and-history',
      'Culture, memory, ideas, and the histories that shape the present.',
      2,
      'plum',
    ],
    [
      'category-africa',
      'Africa',
      'africa',
      'Reporting and perspectives from across Africa.',
      3,
      'pine',
    ],
    [
      'category-americas',
      'Americas',
      'americas',
      'Reporting and perspectives from North, Central, and South America and the Caribbean.',
      4,
      'river',
    ],
    ['category-asia', 'Asia', 'asia', 'Reporting and perspectives from across Asia.', 5, 'clay'],
    [
      'category-australia-oceania',
      'Australia and Oceania',
      'australia-and-oceania',
      'Reporting and perspectives from Australia, New Zealand, and the Pacific.',
      6,
      'river',
    ],
    [
      'category-europe',
      'Europe',
      'europe',
      'Reporting and perspectives from across Europe.',
      7,
      'graphite',
    ],
  ].map(([id, name, slug, description, displayOrder, colorToken]) => ({
    id,
    name,
    slug,
    description,
    displayOrder,
    showInNavigation: true,
    colorToken,
  })),
  topics: [
    {
      id: 'topic-book-reviews',
      name: 'Book Reviews',
      slug: 'book-reviews',
      summary: 'Reviews and critical conversations about books from around the world.',
      timelineIntroduction: 'Read the latest reviews and literary criticism.',
      featured: false,
      heroImage: libraryImage,
      relatedArticleIds: ['article-book'],
    },
    {
      id: 'topic-invitational-pieces',
      name: 'Invitational Pieces',
      slug: 'invitational-pieces',
      summary: 'Original essays and perspectives commissioned from invited contributors.',
      timelineIntroduction: 'Explore contributions from invited writers and specialists.',
      featured: false,
      heroImage: councilImage,
      relatedArticleIds: ['article-ferry-opinion'],
    },
    {
      id: 'topic-analysis',
      name: 'Analysis',
      slug: 'analysis',
      summary: 'Evidence-led interpretation that explains the forces behind current events.',
      timelineIntroduction: 'Read analysis in chronological order.',
      featured: false,
      heroImage: councilImage,
      relatedArticleIds: ['article-budget', 'article-flood-analysis'],
    },
    {
      id: 'topic-world-history',
      name: 'World History',
      slug: 'world-history',
      summary: 'Historical reporting and interpretation connecting the past to the present.',
      timelineIntroduction:
        'Explore stories about the people, places, and events that shaped the world.',
      featured: false,
      heroImage: theaterImage,
      relatedArticleIds: ['article-rialto', 'article-book', 'article-library-brief'],
    },
    {
      id: 'topic-world-events',
      name: 'World Events',
      slug: 'world-events',
      summary: 'Reporting on consequential events and the people experiencing them.',
      timelineIntroduction: 'Follow major developments as the reporting continues.',
      featured: true,
      heroImage: ferryImage,
      relatedArticleIds: [
        'article-harbor',
        'article-budget',
        'article-network',
        'article-market',
        'article-transit',
        'article-flood-analysis',
        'article-broadband-brief',
      ],
    },
    {
      id: 'topic-geopolitics',
      name: 'Geopolitics',
      slug: 'geopolitics',
      summary: 'Power, diplomacy, borders, trade, and the relationships between nations.',
      timelineIntroduction: 'Track the decisions and disputes shaping international affairs.',
      featured: false,
      heroImage: towerImage,
      relatedArticleIds: ['article-harbor', 'article-transit', 'article-ferry-opinion'],
    },
  ],
  sources: [
    {
      id: 'source-fema',
      title: 'National Flood Hazard Layer guidance',
      publisher: 'Federal Emergency Management Agency',
      url: 'https://www.fema.gov/sites/default/files/documents/fema_national-flood-hazard-layer_112021.pdf',
      accessDate: '2026-07-30T00:00:00.000Z',
      note: 'Background reference for flood-risk terminology. Local places and events are fictional.',
    },
    {
      id: 'source-cisa',
      title: 'National Emergency Communications Plan',
      publisher: 'Cybersecurity and Infrastructure Security Agency',
      url: 'https://www.cisa.gov/national-emergency-communications-plan',
      accessDate: '2026-07-30T00:00:00.000Z',
      note: 'Background reference for emergency communications. The reported network is fictional.',
    },
    {
      id: 'source-fcc',
      title: 'How to use the National Broadband Map',
      publisher: 'Federal Communications Commission',
      url: 'https://help.bdc.fcc.gov/hc/en-us/articles/10467446103579-How-to-Use-the-FCC-s-National-Broadband-Map',
      accessDate: '2026-07-30T00:00:00.000Z',
      note: 'Background reference for broadband availability data. The local pilot is fictional.',
    },
    {
      id: 'source-usda',
      title: 'Regional Food Hub Resource Guide',
      publisher: 'USDA Agricultural Marketing Service',
      url: 'https://www.ams.usda.gov/publications/content/regional-food-hub-resource-guide',
      accessDate: '2026-07-30T00:00:00.000Z',
      note: 'Background reference for food-hub operations. The cooperative and local figures are fictional.',
    },
    {
      id: 'source-transit',
      title: 'North Sound transit compact and capital plan',
      publisher: 'Meridian County Transportation Office',
      url: 'https://example.com/meridian-county/transit-compact',
      publicationDate: '2026-07-24T00:00:00.000Z',
      accessDate: '2026-07-30T00:00:00.000Z',
      note: 'Fictional public record created for this editorial edition.',
    },
    {
      id: 'source-nea',
      title: 'Creative Placemaking',
      publisher: 'National Endowment for the Arts',
      url: 'https://www.arts.gov/impact/creative-placemaking',
      accessDate: '2026-07-30T00:00:00.000Z',
      note: 'Background reference for arts-led community development. The Rialto project is fictional.',
    },
  ],
  books: [
    {
      id: 'book-sound-between-streets',
      title: 'The Sound Between Streets',
      author: 'Nora Field',
      publisher: 'Cedar House',
      publicationYear: 2026,
      isbn: '9780000000422',
      informationUrl: 'https://example.com/books/the-sound-between-streets',
      coverImage: libraryImage,
    },
  ],
  generatedAt,
  source: 'fixtures',
});
