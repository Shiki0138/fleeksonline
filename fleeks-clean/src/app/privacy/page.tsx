'use client'

import { motion } from 'framer-motion'
import { Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-300 hover:text-white transition">
                <ArrowLeft className="w-5 h-5" />
                <span>ホームに戻る</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Target className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  FLEEKS
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8"
        >
          <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
          
          <div className="space-y-6 text-gray-200">
            <section>
              <p>
                FLEEKS（以下「当社」といいます。）は、本ウェブサイト上で提供するサービス（以下「本サービス」といいます。）における、
                ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第1条（個人情報）</h2>
              <p>
                「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、
                当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び
                容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報
                （個人識別情報）を指します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第2条（個人情報の収集方法）</h2>
              <p>
                当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、
                クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間で
                なされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。
                以下「提携先」といいます。）などから収集することがあります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第3条（個人情報を収集・利用する目的）</h2>
              <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>当社サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
                <li>上記の利用目的に付随する目的</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第4条（利用目的の変更）</h2>
              <p>
                1. 当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。
              </p>
              <p className="mt-2">
                2. 利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、
                または本ウェブサイト上に公表するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第5条（個人情報の第三者提供）</h2>
              <p>
                1. 当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
                ただし、個人情報保護法その他の法令で認められる場合を除きます。
              </p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、
                本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                <li>予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき</li>
              </ul>
              <p className="mt-2">
                2. 前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。
              </p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                <li>個人情報を特定の者との間で共同して利用する場合であって、その旨並びに共同して利用される個人情報の項目、
                共同して利用する者の範囲、利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について、
                あらかじめ本人に通知し、または本人が容易に知り得る状態に置いた場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第6条（個人情報の開示）</h2>
              <p>
                1. 当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。
                ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、
                開示しない決定をした場合には、その旨を遅滞なく通知します。なお、個人情報の開示に際しては、
                1件あたり1,000円の手数料を申し受けます。
              </p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                <li>その他法令に違反することとなる場合</li>
              </ul>
              <p className="mt-2">
                2. 前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第7条（個人情報の訂正および削除）</h2>
              <p>
                1. ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、
                当社に対して個人情報の訂正、追加または削除（以下「訂正等」といいます。）を請求することができます。
              </p>
              <p className="mt-2">
                2. 当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、
                遅滞なく、当該個人情報の訂正等を行うものとします。
              </p>
              <p className="mt-2">
                3. 当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは
                遅滞なく、これをユーザーに通知します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第8条（個人情報の利用停止等）</h2>
              <p>
                1. 当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、
                または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます。）
                を求められた場合には、遅滞なく必要な調査を行います。
              </p>
              <p className="mt-2">
                2. 前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、
                遅滞なく、当該個人情報の利用停止等を行います。
              </p>
              <p className="mt-2">
                3. 当社は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、
                遅滞なく、これをユーザーに通知します。
              </p>
              <p className="mt-2">
                4. 前2項にかかわらず、利用停止等に多額の費用を有する場合その他利用停止等を行うことが困難な場合であって、
                ユーザーの権利利益を保護するために必要なこれに代わるべき措置をとれる場合は、この代替策を講じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第9条（プライバシーポリシーの変更）</h2>
              <p>
                1. 本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、
                ユーザーに通知することなく、変更することができるものとします。
              </p>
              <p className="mt-2">
                2. 当社が別途定める場合を除いて、変更後のプライバシーポリシーは、
                本ウェブサイトに掲載したときから効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第10条（お問い合わせ窓口）</h2>
              <p>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。</p>
              <div className="mt-3 p-4 bg-white/5 rounded">
                <p>住所：〒000-0000 東京都〇〇区〇〇0-0-0</p>
                <p>社名：FLEEKS</p>
                <p>担当部署：個人情報管理窓口</p>
                <p>Eメールアドレス：privacy@fleeks.jp</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第11条（Cookieの使用について）</h2>
              <p>
                1. 当社のウェブサイトは、ユーザーの利便性向上のため、Cookie を使用しています。
                Cookie により個人を特定できる情報を取得することはありません。
              </p>
              <p className="mt-2">
                2. ユーザーは、ブラウザの設定により Cookie の受信を拒否することができます。
                ただし、Cookie を無効化すると、当社のサービスの一部の機能をご利用いただけなくなる場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">第12条（アクセス解析ツールについて）</h2>
              <p>
                当社のウェブサイトでは、Google によるアクセス解析ツール「Google Analytics」を使用しています。
                Google Analytics は Cookie を使用し、個人を特定する情報を含まずにデータを収集します。
                データ収集のために Cookie を無効にしたい場合は、お使いのブラウザの設定をご確認ください。
                この規約に関しての詳細は Google Analytics 利用規約をご確認ください。
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-white/20 text-sm text-gray-400">
              <p>制定日：2024年1月1日</p>
              <p>最終更新日：2024年1月1日</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}