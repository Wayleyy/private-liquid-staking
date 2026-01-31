import { useState } from 'react'
import { ethers } from 'ethers'
import { ArrowRight, Loader } from 'lucide-react'

const WethWrapper = ({ signer, ethBalance, onSuccess }) => {
  const [wrapAmount, setWrapAmount] = useState('')
  const [isWrapping, setIsWrapping] = useState(false)

  const WETH_ADDRESS = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'

  const handleWrap = async () => {
    if (!wrapAmount || !signer) return

    try {
      setIsWrapping(true)

      const wethContract = new ethers.Contract(
        WETH_ADDRESS,
        ['function deposit() payable'],
        signer
      )

      const tx = await wethContract.deposit({
        value: ethers.parseEther(wrapAmount)
      })

      await tx.wait()

      alert(`Successfully wrapped ${wrapAmount} ETH to WETH!`)
      setWrapAmount('')
      
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Wrap error:', error)
      alert('Failed to wrap ETH: ' + error.message)
    } finally {
      setIsWrapping(false)
    }
  }

  return (
    <div className="glass p-4 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Wrap ETH to WETH</h3>
        <span className="text-xs text-gray-500">1:1 ratio</span>
      </div>

      <p className="text-sm text-gray-400">
        You need WETH to stake. Wrap your ETH first (no fees, just gas).
      </p>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400">Amount</label>
          <span className="text-xs text-gray-600">Balance: {parseFloat(ethBalance).toFixed(4)} ETH</span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={wrapAmount}
            onChange={(e) => setWrapAmount(e.target.value)}
            placeholder="0.0"
            className="input-field pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => setWrapAmount((parseFloat(ethBalance) - 0.001).toFixed(4))}
              className="text-xs text-primary hover:text-primary-dark transition-colors"
            >
              MAX
            </button>
            <span className="text-gray-500 font-medium">ETH</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleWrap}
        disabled={!wrapAmount || isWrapping}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isWrapping ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Wrapping...
          </>
        ) : (
          <>
            Wrap ETH <ArrowRight className="w-4 h-4" /> WETH
          </>
        )}
      </button>

      <div className="text-xs text-gray-600 text-center">
        Gas cost: ~$0.50 • Instant • Reversible
      </div>
    </div>
  )
}

export default WethWrapper
