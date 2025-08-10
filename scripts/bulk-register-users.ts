import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from both .env.local and .env files
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  console.error('Current values:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Email list
const emails = [
  'epic.3jb@gmail.com',
  'yoshizawanaoko0@gmail.com',
  'ono@shes-salon.jp',
  'endlink.yuki@gmail.com',
  'dsk.group0817@gmail.com',
  'yoshi.soa.0402@gmail.com',
  'mt.west.moshers.nsc@gmail.com',
  'kura.hair2022@gmail.com',
  'yuta.s600119@icloud.com',
  'k.t.m.crew.kyan.oo@gmail.com',
  'tanimoto.shouta@icloud.com',
  'mumikosika@gmail.com',
  'cocoa.mona@icloud.com',
  'c26.777@gmail.com',
  'hairsalon.sig.0608@gmail.com',
  'comile.hair@gmail.com',
  'joujouda@gmail.com',
  'turbo.jimnist4227@gmail.com',
  'yuu.1211@yahoo.com',
  's.12110018.k@ymobile.ne.jp',
  'yasu.hsc28@gmail.com',
  'miurahiroaki0611@gmail.com',
  'tomo02030101@gmail.com',
  'kmk9mako@gmail.com',
  'jun1310@icloud.com',
  'ecorica.506@gmail.com',
  'okkey.okkey@icloud.com',
  'luvsurf38@icloud.com',
  '1823ty@gmail.com',
  'info@clear-bylego.com',
  'nana.0125.ryo@gmail.com',
  'atusi100@ezweb.ne.jp',
  's.abc.ss0828@gmail.com',
  'putty4454@gmail.com',
  '0501.eclat@gmail.com',
  'kubu.ts.0605@gmail.com',
  'beer.55yy@gmail.com',
  'daisuke.n.122100@icloud.com',
  'sanbai3838@icloud.com',
  'amkzh361273@gmail.com',
  'ken5ken1310@gmail.com',
  's30zand180sxhispeedlover@gmail.com',
  'munekineko@gmail.com',
  'roversi.hairsalon@gmail.com',
  'mt.0707@icloud.com',
  'goldeneggs666@gmail.com',
  'nakkkan0105@icloud.com',
  'alana.hair2021@gmail.com',
  'ma.xx.zz3316@gmail.com',
  'shinchi@sui-beauty.net',
  'comeghead@yahoo.co.jp',
  'htgdhuvggj@gmail.com',
  'kcnozoe10@gmail.com',
  '1234567893g@i.softbank.jp',
  '217mayao@gmail.com',
  'beautybeast.k.k@gmail.com',
  'superyuki0503@gmail.com',
  'permill2023@gmail.com',
  'macha03213111@gmail.com',
  'reizi0828@gmail.com',
  'meruafi@gmail.com',
  'hirofumisasaki0107@gmail.com',
  'sin-sin-4645@softbank.ne.jp',
  'shigebeauty@gmail.com',
  'mandyfor678@gmail.com',
  'yosukeman1024@gmail.com',
  'chan78202@gmail.com',
  'y-yaki27.beni@docomo.ne.jp',
  'harada1115@icloud.com',
  'ug_kota2@icloud.com',
  'yu.milkboy.oml@softbank.ne.jp',
  'aicoanco2525@gmail.com',
  'yumaohta0806@gmail.com',
  'lavepetfumi@gmail.com',
  'ms90a29@gmail.com',
  'shengutong1@gmail.com',
  'natsuking0823@me.com',
  'hirorin529@gmail.com',
  'piromix-0624@au.com',
  'chieko.cheerful@icloud.com',
  'arima11091125m@gmail.com',
  'tomoyajdabc@ezweb.ne.jp',
  'yusoccer0803@icloud.com',
  'onda.da.0202@gmail.com',
  'pankillwash@gmail.com',
  'm.615yyy@ezweb.ne.jp',
  'koza.sumaho.0415@gmail.com',
  'vios.mens@gmail.com',
  'tototo.totoro1214@gmail.com',
  'arigato.a.h.c@gmail.com',
  'summerkontk@gmail.com',
  'sr.hideaki@gmail.com',
  'nasari20228@gmail.com',
  'adversity.overcome.3@gmail.com',
  'a-444@hotmail.co.jp',
  'tomotomo0508@docomo.ne.jp',
  'katadayusuke@gmail.com',
  'onexarrow@gmail.com',
  'votan0525@gmail.com',
  'qualia.2021.10.10@gmail.com',
  'mellow20151122@gmail.com',
  'contour.kade@gmail.com',
  'code.jaison@gmail.com',
  'momota19841002@icloud.com',
  'mari.k.727@ezweb.ne.jp',
  'nonys561111@gmail.com',
  'hairherodallas@gmail.com',
  'ntkhsn19870826@gmail.com',
  'mi_yu.0117@icloud.com',
  'zae39e597279c@softbank.ne.jp',
  'umemeruis@gmail.com',
  'lever0801@gmail.com',
  'nobutoshihirohata@gmail.com',
  'hk.vv.777@gmail.com',
  'yasu.hioki@gmail.com',
  'omh72754325223v@gmail.com',
  'aki0912onepiece@icloud.com',
  'biscohair2@gmail.com',
  'sacrehair@gmail.com',
  'awaawashampoo1227@gmail.com',
  'ryryry0428@gmail.com',
  'sapporo.matsumura@gmail.com',
  'nhr-529.com@i.softbank.jp',
  'edraddd@i.softbank.jp',
  'orobianco.0925@icloud.com',
  'uyijat@yahoo.co.jp',
  '348190mh@gmail.com',
  'hs.cast2021@gmail.com',
  'salonkuwahara@gmail.com',
  'ryoty616710@gmail.com',
  'cal-shinn-upupup@i.softbank.jp',
  'yokoyamanser10.2@icloud.com',
  'f.fchokkin@icloud.com',
  'shingohosoda@gmail.com',
  'smiloop0903@gmail.com',
  'calhigashi@icloud.com',
  'sm-1122@ezweb.ne.jp',
  'aprilkei0402@gmail.com',
  'ryoya0320@gmail.com',
  'shimaryou3714@gmail.com',
  '9209696perm@gmail.com',
  'kaito216@gmail.com',
  'keitakoseki@gmail.com',
  'ixgxa1211@gmail.com',
  'lokahi2018@yahoo.co.jp',
  'oro.suguru@gmail.com',
  'mdajtwjgdjtpwj@gmail.com',
  'chikuson@live.jp',
  'okamt0406@gmail.com',
  'minney-na-sariii.0619@ezweb.ne.jp',
  'nyaran0505@yahoo.co.jp',
  'say.hello.to.www.38@gmail.com',
  's.c.xoxo@ezweb.ne.jp',
  'wmv_g_u622@yahoo.co.jp',
  'nya.nya24@ezweb.ne.jp',
  '4ge.st0630@gmail.com',
  'xx.kana.mu_um.tty.xx@icloud.com',
  'codebreaker_no6@yahoo.co.jp',
  'haruru423102@gmail.com',
  'yuki.021387@gmail.com',
  'k.towa.k.nf@icloud.com',
  'shota049.alus@gmail.com',
  's.n12030909@gmail.com',
  'courregestenjn@gmail.com',
  'kenkenji0924@gmail.com',
  'mipomipo.lalala@gmail.com',
  '1117hbn@gmail.com',
  'optimist.mitsu@gmail.com',
  'h.b.boy.visual@gmail.com',
  'k.h19890120@gmail.com',
  'mo.handeisart@au.com',
  'thesecil58@gmail.com',
  'kaisoku_runner@icloud.com',
  'e3jpp3e2@i.softbank.jp',
  '2002azzurri@gmail.com',
  'hiroyukitakashima0548@gmail.com',
  'im.hairsalon@gmail.com',
  'sr224xxxx@gmail.com',
  'dirxxhkty@gmail.com',
]

async function bulkRegisterUsers() {
  console.log(`Starting bulk registration for ${emails.length} users...`)
  
  const results = {
    success: [] as string[],
    failed: [] as { email: string; error: string }[],
    existing: [] as string[]
  }

  for (const email of emails) {
    try {
      console.log(`\n[${results.success.length + results.failed.length + results.existing.length + 1}/${emails.length}] Processing: ${email}`)
      
      // Check if user already exists
      const { data: existingUser, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) {
        console.error(`Failed to list users:`, listError.message)
        results.failed.push({ email, error: `User check failed: ${listError.message}` })
        continue
      }
      
      const userExists = existingUser?.users.some(u => u.email === email)
      
      if (userExists) {
        console.log(`User already exists: ${email}`)
        results.existing.push(email)
        continue
      }
      
      // Create user with email as password
      console.log(`Creating auth user...`)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: email, // Using email as initial password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: email.split('@')[0], // Use email prefix as default name
          initial_password: true // Flag to indicate password needs to be changed
        }
      })

      if (authError) {
        console.error(`Failed to create auth user for ${email}:`, authError.message)
        results.failed.push({ email, error: authError.message })
        continue
      }

      if (!authData.user) {
        results.failed.push({ email, error: 'No user data returned' })
        continue
      }

      // First, create entry in beauty_users table (which fleeks_profiles references)
      console.log(`Creating beauty_users entry for user ID: ${authData.user.id}`)
      const { error: beautyUserError } = await supabase
        .from('beauty_users')
        .insert({
          id: authData.user.id,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (beautyUserError) {
        console.error(`Failed to create beauty_users entry for ${email}:`, beautyUserError.message)
        // Try to delete the auth user if beauty_users creation failed
        await supabase.auth.admin.deleteUser(authData.user.id)
        results.failed.push({ email, error: `beauty_users creation failed: ${beautyUserError.message}` })
        continue
      }

      // Create profile with premium membership
      console.log(`Creating fleeks profile for user ID: ${authData.user.id}`)
      const { error: profileError } = await supabase
        .from('fleeks_profiles')
        .insert({
          id: authData.user.id,
          username: email.split('@')[0],
          full_name: email.split('@')[0],
          membership_type: 'premium',
          membership_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          role: 'user'
        })

      if (profileError) {
        console.error(`Failed to create profile for ${email}:`, profileError.message)
        // Try to delete both beauty_users and auth user if profile creation failed
        await supabase.from('beauty_users').delete().eq('id', authData.user.id)
        await supabase.auth.admin.deleteUser(authData.user.id)
        results.failed.push({ email, error: `Profile creation failed: ${profileError.message}` })
        continue
      }

      console.log(`Successfully registered: ${email}`)
      results.success.push(email)
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`Unexpected error for ${email}:`, error)
      results.failed.push({ email, error: String(error) })
    }
  }

  // Print summary
  console.log('\n========== REGISTRATION SUMMARY ==========')
  console.log(`Total emails: ${emails.length}`)
  console.log(`Successfully registered: ${results.success.length}`)
  console.log(`Already existing: ${results.existing.length}`)
  console.log(`Failed: ${results.failed.length}`)
  
  if (results.failed.length > 0) {
    console.log('\nFailed registrations:')
    results.failed.forEach(({ email, error }) => {
      console.log(`- ${email}: ${error}`)
    })
  }
  
  // Save results to file
  const fs = require('fs')
  const resultPath = resolve(__dirname, `../bulk-registration-results-${new Date().toISOString().slice(0, 10)}.json`)
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2))
  console.log(`\nResults saved to: ${resultPath}`)
}

// Run the script
bulkRegisterUsers().catch(console.error)